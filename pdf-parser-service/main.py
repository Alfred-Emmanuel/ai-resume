"""
PDF Parser Service using PyMuPDF (fitz)
A FastAPI microservice for accurate PDF text extraction
"""

import io
import re
import logging
from typing import List, Dict, Any
import fitz  # PyMuPDF
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PDF Parser Service",
    description="High-accuracy PDF text extraction using PyMuPDF",
    version="1.0.0"
)
def _extract_page_text_blocks(page: fitz.Page) -> str:
    """Extract text using blocks to better preserve reading order / columns."""
    try:
        blocks = page.get_text("blocks") or []
    except Exception:
        return page.get_text("text")

    # Sort by top (y0), then left (x0)
    try:
        blocks = sorted(blocks, key=lambda b: (round(b[1], 1), round(b[0], 1)))
    except Exception:
        pass

    texts = []
    for b in blocks:
        # b: (x0, y0, x1, y1, text, block_no, block_type, ...)
        if not isinstance(b, (list, tuple)) or len(b) < 5:
            continue
        text = b[4] or ""
        if not text:
            continue
        # If block type is provided, prefer text blocks (type == 0)
        if len(b) >= 7:
            block_type = b[6]
            if block_type not in (0, None):
                continue
        texts.append(text)

    joined = "\n".join(texts)
    return joined if joined else page.get_text("text")

def _post_process_text(s: str) -> str:
    if not s:
        return s
    # Remove null chars
    s = s.replace("\x00", "")
    # Fix common URL line-break issue: "https:/\n/" -> "https://"
    s = re.sub(r"https:/\s*/", "https://", s)
    # Join hyphenated line breaks: "word-\nword" -> "wordword"
    s = re.sub(r"(\w)-\n(\w)", r"\1\2", s)
    return s.strip()

def _extract_page_text_rawdict(page: fitz.Page) -> str:
    """Reconstruct text using rawdict → spans → lines → paragraphs.
    This aims to preserve reading order and reduce dropped content in multi-column PDFs.
    """
    try:
        rd = page.get_text("rawdict")
    except Exception:
        return _extract_page_text_blocks(page)

    blocks = rd.get("blocks", []) if isinstance(rd, dict) else []
    # Collect lines across blocks with geometry
    collected_lines = []  # entries: (y0, y1, x0, text)

    # Sort blocks top-left order
    def _bbox_key(b):
        bbox = b.get("bbox", [0, 0, 0, 0])
        return (round(bbox[1], 1), round(bbox[0], 1))

    try:
        blocks = sorted(blocks, key=_bbox_key)
    except Exception:
        pass

    for b in blocks:
        if not isinstance(b, dict):
            continue
        if b.get("type", 0) not in (0, None):  # text blocks only
            continue
        lines = b.get("lines", []) or []
        for ln in lines:
            if not isinstance(ln, dict):
                continue
            spans = ln.get("spans", []) or []
            # Sort spans by x origin
            try:
                spans = sorted(spans, key=lambda s: (float(s.get("origin", [0, 0])[0])))
            except Exception:
                pass
            parts = []
            for sp in spans:
                txt = sp.get("text", "") if isinstance(sp, dict) else ""
                if not txt:
                    continue
                parts.append(txt)
            if not parts:
                continue
            text_line = "".join(parts)
            bbox = ln.get("bbox", [0, 0, 0, 0])
            x0, y0, x1, y1 = (float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])) if isinstance(bbox, (list, tuple)) and len(bbox) >= 4 else (0.0, 0.0, 0.0, 0.0)
            collected_lines.append((y0, y1, x0, text_line))

    if not collected_lines:
        return _extract_page_text_blocks(page)

    # Sort all lines top-left
    collected_lines.sort(key=lambda t: (round(t[0], 1), round(t[2], 1)))

    # Group into paragraphs
    paragraphs = []
    current = []
    prev_y1 = None
    prev_x0 = None
    para_gap_thresh = 7.0   # vertical gap threshold for new paragraph
    indent_thresh = 18.0    # horizontal indent change indicating new paragraph / list

    for (y0, y1, x0, text) in collected_lines:
        if prev_y1 is None:
            current.append(text)
        else:
            vgap = y0 - prev_y1
            xdelta = 0 if prev_x0 is None else abs(x0 - prev_x0)
            new_para = (vgap > para_gap_thresh) or (xdelta > indent_thresh and vgap > 2.0)
            if new_para:
                paragraphs.append("\n".join(current))
                current = [text]
            else:
                current.append(text)
        prev_y1 = y1
        prev_x0 = x0

    if current:
        paragraphs.append("\n".join(current))

    # Join paragraphs with blank lines, then post-process
    page_text = "\n\n".join(paragraphs)
    return page_text if page_text else _extract_page_text_blocks(page)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for response
class PageText(BaseModel):
    page_number: int
    text: str

class PDFParseResponse(BaseModel):
    text: str
    pages: List[PageText]
    metadata: Dict[str, Any]

class ErrorResponse(BaseModel):
    error: str
    detail: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "pdf-parser"}

@app.post("/parse", response_model=PDFParseResponse)
async def parse_pdf(file: UploadFile = File(...)):
    """
    Parse PDF file and extract text with page-by-page breakdown
    
    Args:
        file: PDF file uploaded via multipart/form-data
        
    Returns:
        PDFParseResponse: Structured text extraction results
        
    Raises:
        HTTPException: If file is not a PDF or parsing fails
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("application/pdf"):
            raise HTTPException(
                status_code=400,
                detail="File must be a PDF (application/pdf)"
            )
        
        logger.info(f"Processing PDF file: {file.filename}")
        
        # Read file content
        file_content = await file.read()

        # Use context manager to ensure document lifetime is managed correctly
        pages_data = []
        full_text = ""
        try:
            with fitz.open(stream=file_content, filetype="pdf") as pdf_document:
                # Handle encrypted PDFs: try empty password, otherwise return 400
                try:
                    if getattr(pdf_document, "needs_pass", False):
                        pdf_document.authenticate("")
                except Exception:
                    pass
                if getattr(pdf_document, "needs_pass", False):
                    raise HTTPException(status_code=400, detail="PDF is encrypted and requires a password")

                page_count = pdf_document.page_count
                for page_num in range(page_count):
                    try:
                        page = pdf_document.load_page(page_num)
                        page_text = _extract_page_text_rawdict(page)
                    except Exception as page_err:
                        logger.error(f"Error extracting page {page_num + 1}: {page_err}")
                        raise

                    cleaned_text = _post_process_text(page_text)

                    pages_data.append(PageText(
                        page_number=page_num + 1,
                        text=cleaned_text
                    ))

                    full_text += cleaned_text + "\n"
        except RuntimeError as re:
            # Retry with BytesIO stream if we hit odd stream-related issues
            logger.warning(f"Primary open failed: {re}. Retrying with BytesIO stream...")
            import io as _io
            with fitz.open(stream=_io.BytesIO(file_content).read(), filetype="pdf") as pdf_document:
                page_count = pdf_document.page_count
                for page_num in range(page_count):
                    page = pdf_document.load_page(page_num)
                    page_text = page.get_text("text")
                    cleaned_text = page_text.replace('\x00', '').strip()
                    pages_data.append(PageText(page_number=page_num + 1, text=cleaned_text))
                    full_text += cleaned_text + "\n"

        full_text = _post_process_text(full_text)

        metadata = {
            "page_count": page_count,
            "filename": file.filename,
            "file_size": len(file_content)
        }

        logger.info(f"Successfully parsed PDF: {file.filename}, {page_count} pages")

        return PDFParseResponse(
            text=full_text,
            pages=pages_data,
            metadata=metadata
        )
        
    except fitz.FileDataError as e:
        logger.error(f"PDF file error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid PDF file: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error parsing PDF: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse PDF: {str(e)}"
        )

@app.post("/parse-text-only")
async def parse_pdf_text_only(file: UploadFile = File(...)):
    """
    Simplified endpoint that returns only the full text (for backward compatibility)
    
    Args:
        file: PDF file uploaded via multipart/form-data
        
    Returns:
        dict: Simple response with extracted text
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("application/pdf"):
            raise HTTPException(
                status_code=400,
                detail="File must be a PDF (application/pdf)"
            )
        
        logger.info(f"Processing PDF file (text-only): {file.filename}")
        
        # Read file content
        file_content = await file.read()

        # Use context manager to ensure proper lifetime
        try:
            with fitz.open(stream=file_content, filetype="pdf") as pdf_document:
                # Handle encrypted PDFs
                try:
                    if getattr(pdf_document, "needs_pass", False):
                        pdf_document.authenticate("")
                except Exception:
                    pass
                if getattr(pdf_document, "needs_pass", False):
                    raise HTTPException(status_code=400, detail="PDF is encrypted and requires a password")

                page_count = pdf_document.page_count
                full_text = ""
                for page_num in range(page_count):
                    try:
                        page = pdf_document.load_page(page_num)
                        page_text = _extract_page_text_rawdict(page)
                    except Exception as page_err:
                        logger.error(f"Error extracting page {page_num + 1}: {page_err}")
                        raise
                    full_text += page_text + "\n"
        except RuntimeError as re:
            logger.warning(f"Primary open failed: {re}. Retrying with BytesIO stream...")
            import io as _io
            with fitz.open(stream=_io.BytesIO(file_content).read(), filetype="pdf") as pdf_document:
                page_count = pdf_document.page_count
                full_text = ""
                for page_num in range(page_count):
                    page = pdf_document.load_page(page_num)
                    page_text = _extract_page_text_rawdict(page)
                    full_text += page_text + "\n"

        full_text = _post_process_text(full_text)

        logger.info(f"Successfully parsed PDF (text-only): {file.filename}")

        return {
            "text": full_text,
            "page_count": page_count,
            "filename": file.filename
        }
        
    except fitz.FileDataError as e:
        logger.error(f"PDF file error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid PDF file: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error parsing PDF: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse PDF: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

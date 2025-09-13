import React, { useRef } from "react";
import { validateFile } from "../../utils";
import { FILE_UPLOAD } from "../../constants";
import Button from "./Button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  disabled = false,
  loading = false,
  className = "",
  accept = ".pdf,.docx,.doc",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      // You might want to show an error message here
      console.error(validation.error);
      return;
    }

    onFileSelect(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || loading}
      />
      <Button
        onClick={triggerFileUpload}
        disabled={disabled || loading}
        loading={loading}
        variant="primary"
      >
        {loading ? "Uploading..." : "Choose File"}
      </Button>
    </div>
  );
};

export default FileUpload;

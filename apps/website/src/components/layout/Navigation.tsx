import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";

interface NavigationProps {
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onLogout }) => {
  const { user } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">AI Resume App</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome, {user?.email}
            </span>
            <Button onClick={onLogout} variant="danger" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

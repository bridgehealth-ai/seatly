import React from "react";

export type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  style = {},
  className = "",
}) => {
  const baseStyles: React.CSSProperties = {
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    fontSize: "inherit",
    transition: "all 0.2s ease",
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? "100%" : "auto",
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: {
      padding: "0.25rem 0.5rem",
      fontSize: "0.875rem",
    },
    medium: {
      padding: "0.5rem 1rem",
    },
    large: {
      padding: "0.75rem 1.5rem",
      fontSize: "1.125rem",
    },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: disabled ? "#ccc" : "#007bff",
      color: "#fff",
      borderColor: disabled ? "#ccc" : "#007bff",
    },
    secondary: {
      backgroundColor: disabled ? "#f8f9fa" : "#6c757d",
      color: "#fff",
      borderColor: disabled ? "#dee2e6" : "#6c757d",
    },
    danger: {
      backgroundColor: disabled ? "#f8d7da" : "#dc3545",
      color: "#fff",
      borderColor: disabled ? "#f5c6cb" : "#dc3545",
    },
  };

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={combinedStyles}
      className={className}
    >
      {children}
    </button>
  );
};

export default Button;



import React from "react";

export type InputProps = {
  id: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  error?: string;
  helperText?: string;
};

export const Input: React.FC<InputProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder,
  disabled = false,
  autoComplete,
  style = {},
  containerStyle = {},
  labelStyle = {},
  error,
  helperText,
}) => {
  const defaultContainerStyle: React.CSSProperties = {
    marginBottom: "1rem",
    ...containerStyle,
  };

  const defaultLabelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.25rem",
    ...labelStyle,
  };

  const defaultInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem",
    boxSizing: "border-box",
    borderRadius: "4px",
    border: error ? "1px solid #dc3545" : "1px solid #ccc",
    fontSize: "1rem",
    fontFamily: "inherit",
    ...style,
  };

  return (
    <div style={defaultContainerStyle}>
      <label htmlFor={id} style={defaultLabelStyle}>
        {label}
        {required && <span style={{color: "red"}}> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        style={defaultInputStyle}
      />
      {error && (
        <p style={{color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem", margin: "0.25rem 0 0 0"}}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p style={{color: "#6c757d", fontSize: "0.875rem", marginTop: "0.25rem", margin: "0.25rem 0 0 0"}}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;


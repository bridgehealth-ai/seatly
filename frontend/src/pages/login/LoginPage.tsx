import React from "react";
import AuthForm from "@/components/AuthForm";
import "@/style/SignupPage.css";

export const LoginPage: React.FC = () => {
    return (
        <div className="signup-page">
            <div className="signup-page__content">
                <AuthForm mode="login" />
            </div>
        </div>
    );
};

export default LoginPage;
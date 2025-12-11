import React from "react";
import AuthForm from "@/components/AuthForm";
import "@/style/SignupPage.css";

export const SignupPage: React.FC = () => {
    return (
        <div className="signup-page">
            <div className="signup-page__content">
                <AuthForm mode="signup" />
            </div>
        </div>
    );
};

export default SignupPage;
import React, {type FormEvent, useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useLoginMutation, useSignupMutation} from "@/hooks/useAuth";
import {useAuth} from "@/context/AuthContext";
import Button from "@/pageElements/Button";
import Input from "@/pageElements/Input";

type AuthFormMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthFormMode;
};

export const AuthForm: React.FC<AuthFormProps> = ({mode}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const navigate = useNavigate();
  const {login: setAuthData} = useAuth();

  const loginMutation = useLoginMutation();
  const signupMutation = useSignupMutation();

  const isLogin = mode === "login";
  const mutation = isLogin ? loginMutation : signupMutation;
  const {mutate, isPending, isError, isSuccess, error, data} = mutation;

  useEffect(() => {
    if (!isLogin && isSuccess) {
      navigate("/login");
    }
  }, [isSuccess, navigate, isLogin]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      mutate(
        {
          email: email.trim(),
          password,
        },
        {
          onSuccess: (data: any) => {
            setAuthData({
              user: {
                id: data.id,
                email: data.email,
                fullName: data.fullName,
              },
              accessToken: data.token,
            });
            navigate("/dashboard", {replace: true});
          },
        },
      );
    } else {
      mutate({
        email: email.trim(),
        password,
        fullName: fullName.trim() || null,
      });
    }
  };

  const formConfig = {
    login: {
      title: "Log in",
      submitText: "Log in",
      submitPendingText: "Logging in...",
      successMessage: data ? `Login successful. Email: ${(data as any).email}` : null,
      switchText: "Need an account?",
      switchLinkText: "Sign up",
      switchLinkTo: "/signup",
    },
    signup: {
      title: "Sign up",
      submitText: "Sign up",
      submitPendingText: "Signing up...",
      successMessage: data ? `Account created successfully. Email: ${(data as any).email}` : null,
      switchText: "Already have an account?",
      switchLinkText: "Log in",
      switchLinkTo: "/login",
    },
  };

  const config = formConfig[mode];

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "3rem auto",
        padding: "2rem",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontFamily: "inherit",
      }}
    >
      <h1 style={{marginBottom: "1.5rem", fontSize: "1.5rem"}}>
        {config.title}
      </h1>

      <form onSubmit={handleSubmit}>
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />

        {!isLogin && (
          <Input
            id="fullName"
            label="Full name (optional)"
            type="text"
            value={fullName}
            onChange={setFullName}
          />
        )}

        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
        />

        <Button
          type="submit"
          disabled={isPending}
          style={isLogin ? {marginRight: "0.75rem"} : undefined}
        >
          {isPending ? config.submitPendingText : config.submitText}
        </Button>

        {isLogin && (
          <span style={{fontSize: "0.9rem"}}>
            {config.switchText}{" "}
            <Link to={config.switchLinkTo}>{config.switchLinkText}</Link>
          </span>
        )}
      </form>

      {isError && (
        <p style={{marginTop: "1rem", color: "red"}}>
          {(error as Error).message}
        </p>
      )}

      {isSuccess && config.successMessage && (
        <div style={{marginTop: "1.5rem", fontSize: "0.9rem"}}>
          <p>{config.successMessage}</p>
        </div>
      )}

      {!isLogin && (
        <span style={{fontSize: "0.9rem"}}>
          {config.switchText} <Link to={config.switchLinkTo}>{config.switchLinkText}</Link>
        </span>
      )}
    </div>
  );
};

export default AuthForm;



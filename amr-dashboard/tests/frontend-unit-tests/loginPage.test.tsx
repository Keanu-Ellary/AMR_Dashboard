/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { render,screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { default: LoginPage } = require("@/app/login/page");
import { login } from "@/app/services/authService";
import { toast } from "react-toastify";

jest.mock("@/app/services/authService", () => ({
    login: jest.fn(),
}));

jest.mock("react-toastify", () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

const mockedLogin = login as jest.MockedFunction<typeof login>;

describe("Login Page Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Renders Login Page Successfully", () => {
        render(<LoginPage />);

        expect(screen.getByText("AMR SURVEILLANCE DASHBOARD")).toBeInTheDocument();
        expect(screen.getByText("Please Enter Your Details")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "✖ Go Back" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Reset Password"} )).toBeInTheDocument();
    });

    it("Displays error toast if email and password is missing", async () => {
        render(<LoginPage />);

        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please enter email and password.");
        });
    });

    it("Displays error toast if only email is missing", async () => {
        render(<LoginPage />);

        const passwordInput = screen.getByPlaceholderText("Password");
        await userEvent.type(passwordInput, "testpassword");
        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please enter email and password.");
        });
    });

    it("Displays error popup if email is invalid", async () => {
        render(<LoginPage />);

        const emailInput = screen.getByPlaceholderText("Email");
        await userEvent.type(emailInput, "testemail");
        const passwordInput = screen.getByPlaceholderText("Password");
        await userEvent.type(passwordInput, "testpassword");
        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        expect(mockedLogin).not.toHaveBeenCalledWith();
    });

    it("Displays error toast if only password is missing", async () => {
        render(<LoginPage />);

        const emailInput = screen.getByPlaceholderText("Email");
        await userEvent.type(emailInput, "test@email.com");
        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please enter email and password.");
        });
    });

    it("Displays error toast if credentials are incorrect", async () => {
        mockedLogin.mockResolvedValue({ status: 500,
            json: jest.fn().mockResolvedValue({})
         } as any);
        render(<LoginPage />);

        const emailInput = screen.getByPlaceholderText("Email");
        await userEvent.type(emailInput, "test@email.com");
        const passwordInput = screen.getByPlaceholderText("Password");
        await userEvent.type(passwordInput, "testpassword");
        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Login failed. Please try again.");
        });
    });

    it("Displays success toast if credentials are correct", async () => {
        mockedLogin.mockResolvedValue({ 
            status: 200, 
            json: jest.fn().mockResolvedValue({ token: "valid-token" }),
        } as any);
        render(<LoginPage />);

        const emailInput = screen.getByPlaceholderText("Email");
        await userEvent.type(emailInput, "test@email.com");
        const passwordInput = screen.getByPlaceholderText("Password");
        await userEvent.type(passwordInput, "testpassword");
        const loginButton = screen.getByRole("button", { name: "Login" });
        await userEvent.click(loginButton);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Login successful!");
        });
    });

    it("Navigates to dashboard when 'Go Back' is clicked", async () => {
        const historyBackSpy = jest.spyOn(window.history, "back").mockImplementation(() => {});
        render(<LoginPage />);

        const goBackButton = screen.getByRole("button", { name: "✖ Go Back" });
        await userEvent.click(goBackButton);

        expect(historyBackSpy).toHaveBeenCalled();
        historyBackSpy.mockRestore();
    });

    it("Navigates to reset-password page when 'Forgot Password' is clicked", async () => {
        render(<LoginPage />);

        const forgotPasswordButton = screen.getByRole("link", { name: "Reset Password" });
        expect(forgotPasswordButton).toHaveAttribute("href", "/reset-password");
    });

});
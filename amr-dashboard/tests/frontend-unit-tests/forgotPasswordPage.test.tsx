import { render,screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { default: ForgotPasswordPage } = require("@/app/forgot-password/page");
import { resetPassword } from "@/app/services/authService";
import { toast } from "react-toastify";

jest.mock("@/app/services/authService", () => ({
    resetPassword: jest.fn(),
}));

jest.mock("react-toastify", () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

const mockNavigation = jest.fn();
jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockNavigation,
    }),
}));

const mockedResetPassword = resetPassword as jest.MockedFunction<typeof resetPassword>;

describe("Forgot Password Page Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Renders Forgot Password Page Successfully", () => {
        render(<ForgotPasswordPage />);

        expect(screen.getByText("AMR SURVEILLANCE DASHBOARD")).toBeInTheDocument();
        expect(screen.getByText("Change your password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("New Password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Confirm New Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Confirm Change" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "✖ Go Back" })).toBeInTheDocument();
    });

    it("Displays error toast if email and password is missing", async () => {
        render(<ForgotPasswordPage />);

        const changePasswordButton = screen.getByRole("button", { name: "Confirm Change" });
        await userEvent.click(changePasswordButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please enter email and password.");
        });
    });

    it("Displays error toast if only email is missing", async () => {
        render(<ForgotPasswordPage />);

        const passwordInput = screen.getByPlaceholderText("New Password");
        await userEvent.type(passwordInput, "testpassword");
        const confirmPasswordInput = screen.getByPlaceholderText("Confirm New Password");
        await userEvent.type(confirmPasswordInput, "testpassword");
        const changePasswordButton = screen.getByRole("button", { name: "Confirm Change" });
        await userEvent.click(changePasswordButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please enter email and password.");
        });
    });

    it("Displays error popup if email is invalid", async () => {
        render(<ForgotPasswordPage />);

        const emailInput = screen.getByPlaceholderText("Email Address");
        await userEvent.type(emailInput, "testemail");
        const passwordInput = screen.getByPlaceholderText("New Password");
        await userEvent.type(passwordInput, "testpassword");
        const confirmPasswordInput = screen.getByPlaceholderText("Confirm New Password");
        await userEvent.type(confirmPasswordInput, "testpassword");
        const changePasswordButton = screen.getByRole("button", { name: "Confirm Change" });
        await userEvent.click(changePasswordButton);

        expect(mockedResetPassword).not.toHaveBeenCalledWith();
    });

    it("Displays error toast if only password is missing", async () => {
        render(<ForgotPasswordPage />);

        const emailInput = screen.getByPlaceholderText("Email Address");
        await userEvent.type(emailInput, "test@email.com");
        const changePasswordButton = screen.getByRole("button", { name: "Confirm Change" });
        await userEvent.click(changePasswordButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please enter email and password.");
        });
    });

    it("Displays error toast if passwords don't match", async () => {
        render(<ForgotPasswordPage />);

        const emailInput = screen.getByPlaceholderText("Email Address");
        await userEvent.type(emailInput, "test@email.com");
        const passwordInput = screen.getByPlaceholderText("New Password");
        await userEvent.type(passwordInput, "testpassword1");
        const confirmPasswordInput = screen.getByPlaceholderText("Confirm New Password");
        await userEvent.type(confirmPasswordInput, "testpassword2");
        const changePasswordButton = screen.getByRole("button", { name: "Confirm Change" });
        await userEvent.click(changePasswordButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Passwords do not match.");
        });
    });

    it("Show password successfully unhides password", async () => {
        render(<ForgotPasswordPage />);

        const passwordInput = screen.getByPlaceholderText("New Password");
        await userEvent.type(passwordInput, "testpassword1");
        const confirmPasswordInput = screen.getByPlaceholderText("Confirm New Password");
        await userEvent.type(confirmPasswordInput, "testpassword2");

        expect((passwordInput as HTMLInputElement).type).toBe("password");
        expect((confirmPasswordInput as HTMLInputElement).type).toBe("password");

        const hidePasswordButtons = screen.getAllByRole("button", { name: "" });
        await userEvent.click(hidePasswordButtons[0]);

        expect((passwordInput as HTMLInputElement).type).toBe("text");
        expect((passwordInput as HTMLInputElement).value).toBe("testpassword1");
        expect((confirmPasswordInput as HTMLInputElement).type).toBe("text");
        expect((confirmPasswordInput as HTMLInputElement).value).toBe("testpassword2");
    });

    it("Displays error toast if user does not exist", async () => {
        mockedResetPassword.mockRejectedValue(new Error("User not found"));
        render(<ForgotPasswordPage />);

        const emailInput = screen.getByPlaceholderText("Email Address");
        await userEvent.type(emailInput, "test@email.com");
        const passwordInput = screen.getByPlaceholderText("New Password");
        await userEvent.type(passwordInput, "testpassword");
        const confirmPasswordInput = screen.getByPlaceholderText("Confirm New Password");
        await userEvent.type(confirmPasswordInput, "testpassword");
        const changePasswordButton = screen.getByRole("button", { name: "Confirm Change" });
        await userEvent.click(changePasswordButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("User not found");
        });
    });

    it("Displays success toast if credentials are correct", async () => {
        mockedResetPassword.mockResolvedValue({ status: 200, data: { token: "valid-token" } } as any);
        render(<ForgotPasswordPage />);

        const emailInput = screen.getByPlaceholderText("Email Address");
        await userEvent.type(emailInput, "test@email.com");
        const passwordInput = screen.getByPlaceholderText("New Password");
        await userEvent.type(passwordInput, "testpassword");
        const confirmPasswordInput = screen.getByPlaceholderText("Confirm New Password");
        await userEvent.type(confirmPasswordInput, "testpassword");
        const changePasswordButton = screen.getByRole("button", { name: "Confirm Change" });
        await userEvent.click(changePasswordButton);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Password reset successfully. Redirecting to login...");
        });
    });

    it("Navigates to login when 'Go Back' is clicked", async () => {
        render(<ForgotPasswordPage />);

        const goBackButton = screen.getByRole("button", { name: "✖ Go Back" });
        await userEvent.click(goBackButton);

        expect(mockNavigation).toHaveBeenCalledWith("/login");
    });

});
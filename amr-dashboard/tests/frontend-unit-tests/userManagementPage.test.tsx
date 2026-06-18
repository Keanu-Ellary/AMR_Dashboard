/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render,screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { default: UserManagementPage } = require("@/app/user-management/page");
import { getMe } from "@/app/services/authService";
import { getAllAdmins, registerAdmin, deleteAdmin } from "@/app/services/adminService";
import { toast } from "react-toastify";

global.fetch = jest.fn();
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;
const { useRouter } = require('next/navigation');
const mockPush = jest.fn();

jest.mock('@/app/services/authService', () => ({
    getMe: jest.fn(),
}));
jest.mock('@/app/services/adminService', () => ({
    getAllAdmins: jest.fn(),
    registerAdmin: jest.fn(),
    deleteAdmin: jest.fn(),
}));
jest.mock("react-toastify", () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;
const mockedGetAllAdmins = getAllAdmins as jest.MockedFunction<typeof getAllAdmins>;
const mockedRegisterAdmin = registerAdmin as jest.MockedFunction<typeof registerAdmin>;
const mockedDeleteAdmin = deleteAdmin as jest.MockedFunction<typeof deleteAdmin>;
const mockAdminUser = { id: 1, name: 'Admin', surname:'Mock', email: 'admin@test.com', isAdmin: true, token:'validToken' };
const NormalUser = { id: 2, name: 'Norman',surname:'Mock', email: 'user@test.com', isAdmin: false };
const mockAdminResponse = (users = [mockAdminUser]) => ({
   adminUsers: users,
});

const renderAndWait = async (ui: React.ReactElement) => {
    let result: any;
    await act(async () => {
        result = render(ui);
    });
    return result;
};

describe("User Mangement Page Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetMe.mockResolvedValue(mockAdminUser as any);
        mockedGetAllAdmins.mockResolvedValue(mockAdminResponse() as any);
    });

    it('Page renders successfully for admins', async () => {
        await renderAndWait(<UserManagementPage />);

        expect(screen.getByText('Admin Management')).toBeInTheDocument();
        expect(screen.getByText('Add and delete admin users')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add Admin'})).toBeInTheDocument();
        expect(screen.getByText('Admin Name')).toBeInTheDocument();
        expect(screen.getByText('Surname')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('Normal users re-directed and error toast displayed', async () => {
        const mockPush = jest.fn();
        useRouter.mockReturnValue({ push: mockPush });
        mockedGetMe.mockResolvedValue(NormalUser);
        await renderAndWait(<UserManagementPage />);

        expect(toast.error).toHaveBeenCalledWith('Access denied. Admin authorization required.');
        expect(mockPush).toHaveBeenCalledWith('/home');
    });

    it('Redirects user if getMe says unauthorised', async () => {
        const mockPush = jest.fn();
        useRouter.mockReturnValue({ push: mockPush });
        mockedGetMe.mockRejectedValue(new Error('Unauthorized'));
        await renderAndWait(<UserManagementPage />);

        expect(mockPush).toHaveBeenCalledWith('/home');
    });

    it('Displays error toast when getAllAdmins fails', async () => {
        mockedGetAllAdmins.mockRejectedValue(new Error('Sneak attack :('));
        await renderAndWait(<UserManagementPage />);

        expect(toast.error).toHaveBeenCalledWith('Failed to get all admins.');
    });


    it('Search displays no admins for no matches successfully', async () => {
        await renderAndWait(<UserManagementPage />);

        await userEvent.type(screen.getByPlaceholderText('Search admins...'), 'nonexistent');

        expect(screen.getByText('No admins match the search terms.')).toBeInTheDocument();
    });

    it('Search admin successfully by search', async () => {
        mockedGetAllAdmins.mockResolvedValue(mockAdminResponse([
            mockAdminUser,
            { ...mockAdminUser, id: 2, name: 'Imposter', surname:'Fake', email: 'imposter@example.com'},
        ]) as any);
        await renderAndWait(<UserManagementPage />);

        const searchComponent = screen.getByPlaceholderText('Search admins...')
        await userEvent.type(searchComponent, 'Admin');

        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.queryByText('Imposter Admin')).not.toBeInTheDocument();
    });

    describe('Add Admin', () =>{
        it('Successfully displays Add Admin form when button is clicked', async () => {
            await renderAndWait(<UserManagementPage />);

            const addAdminButton = screen.getByRole('button', { name: 'Add Admin'});
            await userEvent.click(addAdminButton);
            expect(screen.getByText('Add New Admin')).toBeInTheDocument();
            expect(screen.getByText('Name')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Cancel'}));
        });

        it('Submit button when adding a admin disabled if required fields are empty', async () => {
            await renderAndWait(<UserManagementPage />);

            const addAdminButton = screen.getByRole('button', { name: 'Add Admin'});
            await userEvent.click(addAdminButton);
            const submitButton = screen.getAllByRole('button', { name: 'Add Admin'});
            expect(submitButton[1]).toBeDisabled();
        });

        it('Submit button when adding a record enabled if required fields are filled', async () => {
            await renderAndWait(<UserManagementPage />);

            const addAdminButton = screen.getByRole('button', { name: 'Add Admin'});
            await userEvent.click(addAdminButton);

            const fieldComponent = screen.getByPlaceholderText('Name');
            await userEvent.type(fieldComponent, 'Test Admin');
            const fieldComponent2 = screen.getByPlaceholderText('Surname')
            await userEvent.type(fieldComponent2, 'Test Surname');
            const fieldComponent3 = screen.getByPlaceholderText('admin@example.com')
            await userEvent.type(fieldComponent3, 'test@example.com');

            const submitButton = screen.getAllByRole('button', { name: 'Add Admin'});
            expect(submitButton[1]).not.toBeDisabled();
        });

        it('Successfully submits and displays toast', async () => {
            mockedRegisterAdmin.mockResolvedValue({ status:201 } as any);
            await renderAndWait(<UserManagementPage />);

            const addAdminButton = screen.getByRole('button', { name: 'Add Admin'});
            await userEvent.click(addAdminButton);

            const fieldComponent = screen.getByPlaceholderText('Name');
            await userEvent.type(fieldComponent, 'Test Admin');
            const fieldComponent2 = screen.getByPlaceholderText('Surname')
            await userEvent.type(fieldComponent2, 'Test Surname');
            const fieldComponent3 = screen.getByPlaceholderText('admin@example.com')
            await userEvent.type(fieldComponent3, 'test@example.com');
            const submitButton = screen.getAllByRole('button', { name: 'Add Admin'});
            await userEvent.click(submitButton[1]);

            expect(mockedRegisterAdmin).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Admin added successfully!');
        });

        it('Displays error toast if add admin fails', async () => {
            mockedRegisterAdmin.mockRejectedValue(new Error('Error'));
            await renderAndWait(<UserManagementPage />);

            const addAdminButton = screen.getByRole('button', { name: 'Add Admin'});
            await userEvent.click(addAdminButton);

            const fieldComponent = screen.getByPlaceholderText('Name');
            await userEvent.type(fieldComponent, 'Test Admin');
            const fieldComponent2 = screen.getByPlaceholderText('Surname')
            await userEvent.type(fieldComponent2, 'Test Surname');
            const fieldComponent3 = screen.getByPlaceholderText('admin@example.com')
            await userEvent.type(fieldComponent3, 'test@example.com');
            const submitButton = screen.getAllByRole('button', { name: 'Add Admin'});
            await userEvent.click(submitButton[1]);

            expect(mockedRegisterAdmin).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalledWith('Failed to add new admin.');
        });

        it('Closes Add Admin form when cancel is clicked', async () => {
            await renderAndWait(<UserManagementPage />);

            const addAdminButton = screen.getByRole('button', { name: 'Add Admin'});
            await userEvent.click(addAdminButton);
            const cancelButton = screen.getByRole('button', { name: 'Cancel'});
            await userEvent.click(cancelButton);

            expect(screen.getByText('Admin Management')).toBeInTheDocument();
        });
    });
})
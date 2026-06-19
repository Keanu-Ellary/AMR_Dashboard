/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render,screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { default: DataManagementPage } = require("@/app/data-management/page");
import { getMe } from "@/app/services/authService";
import { getAllSites, addSiteData, addMutlipleSiteData, updateSite } from "@/app/services/siteService";
import { toast } from "react-toastify";

global.fetch = jest.fn();
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;
const { useRouter } = require('next/navigation');
const mockPush = jest.fn();

jest.mock('@/app/services/authService', () => ({
    getMe: jest.fn(),
}));
jest.mock('@/app/services/siteService', () => ({
    getAllSites: jest.fn(),
    addSiteData: jest.fn(),
    updateSite: jest.fn(),
    addMutlipleSiteData: jest.fn(),
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

jest.mock('@/components/add-data/confirmFile', () => ({ file, handleConfirm, handleCancel }: any) => (
    file ? (
        <div data-testid="confirm-file">
            <button onClick={handleConfirm}>Confirm Upload</button>
            <button onClick={handleCancel}>Cancel Upload</button>
        </div>
    ) : null
));

jest.mock('@/components/WaterQualityFormula', () => () => <div data-testid="mock-wqi-formula" />);


const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;
const mockedGetAllSites = getAllSites as jest.MockedFunction<typeof getAllSites>;
const mockedAddSiteData = addSiteData as jest.MockedFunction<typeof addSiteData>;
const mockedUpdateSite = updateSite as jest.MockedFunction<typeof updateSite>;
const mockedAddMultipleSiteData = addMutlipleSiteData as jest.MockedFunction<typeof addMutlipleSiteData>;

const mockSite = {
    id: 1,
    sampleName: 'Fake Sample :D',
    geoLocName: 'Mock Geo Loc Name',
    collectionDate: '2026-11-09T00:00:00Z',
    temperature: 25.0,
    ph: 8.9,
    tds: 100.0,
    dissolvedO2: 1.0,
    amrResGenes: 'Fake Gene',
    dangerZone: 'green',
    latitude: -20.0,
    longitude: 20.0,
    organism: 'Fake Organism',
    isolateId: 'Fake ID',
    predictedSir: 'Resistant',
    sampleAnalysisType: 'Fake Sample Type',
    isolationSource: 'Fake Source',
};

const mockAdminUser = { id: 1, name: 'Admin', email: 'admin@test.com', isAdmin: true };
const NormalUser = { id: 2, name: 'Norman', email: 'user@test.com', isAdmin: false };

const mockSiteResponse = (sites = [mockSite]) => ({
    ok: true,
    json: async () => ({ sites }),
});

const renderAndWait = async (ui: React.ReactElement) => {
    let result: any;
    await act(async () => {
        result = render(ui);
    });
    return result;
};

describe("Date Management Page Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetMe.mockResolvedValue(mockAdminUser as any);
        mockedGetAllSites.mockResolvedValue(mockSiteResponse() as any);
    });

    it('Page renders successfully for admins', async () => {
        await renderAndWait(<DataManagementPage />);

        expect(screen.getByText('Administrative Data Management')).toBeInTheDocument();
        expect(screen.getByText('Ingest, edit, and perform secure purging of sample isolates')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add Record'})).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Import File'})).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete'})).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Locations Summary'})).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Isolates Detail'})).toBeInTheDocument();
        expect(screen.getByText('Manage Site Locations')).toBeInTheDocument();
        expect(screen.getByText('Select locations to perform bulk delete operations')).toBeInTheDocument();
        expect(screen.getByText('Location Name')).toBeInTheDocument();
        expect(screen.getByText('Coordinates')).toBeInTheDocument();
        expect(screen.getByText('Samples')).toBeInTheDocument();
        expect(screen.getByText('Latest Date')).toBeInTheDocument();
    });

    it('Normal users re-directed and error toast displayed', async () => {
        const mockPush = jest.fn();
        useRouter.mockReturnValue({ push: mockPush });
        mockedGetMe.mockResolvedValue(NormalUser);
        await renderAndWait(<DataManagementPage />);

        expect(toast.error).toHaveBeenCalledWith('Access denied. Admin authorization required.');
        expect(mockPush).toHaveBeenCalledWith('/home');
    });

    it('Redirects user if getMe says unauthorised', async () => {
        const mockPush = jest.fn();
        useRouter.mockReturnValue({ push: mockPush });
        mockedGetMe.mockRejectedValue(new Error('Unauthorized'));
        await renderAndWait(<DataManagementPage />);

        expect(mockPush).toHaveBeenCalledWith('/home');
    });

    it('Loading displays successfully', async () => {
        mockedGetMe.mockImplementation(() => new Promise(() => {}));
        mockedGetAllSites.mockResolvedValue(mockSiteResponse() as any);
        await renderAndWait(<DataManagementPage />);

        expect(screen.getByText('Loading Records...')).toBeInTheDocument();
    });

    it('Displays error toast when getAllSites fails', async () => {
        mockedGetAllSites.mockRejectedValue(new Error('Sneak attack :('));
        await renderAndWait(<DataManagementPage />);

        expect(toast.error).toHaveBeenCalledWith('Failed to load inventory data');
    });

    it('Refresh calls getAllSites successfully', async () => {
        await renderAndWait(<DataManagementPage />);

        const refreshButton = screen.getByRole('button', { name: ''});
        await userEvent.click(refreshButton);
        
        expect(mockedGetAllSites).toHaveBeenCalledTimes(2);
    });

    it('Switches to Isolates Detail Tab when clicked succesfully', async () => {
        mockedGetAllSites.mockResolvedValue(mockSiteResponse([{
            ...mockSite,
            sampleName: 'Fake Sample :D',
        }]) as any);
        await renderAndWait(<DataManagementPage />);

        const isolateDetailTabButton = screen.getByRole('button', { name: 'Isolates Detail'});
        await userEvent.click(isolateDetailTabButton);

        expect(screen.getByText('Manage Individual Isolate Samples')).toBeInTheDocument();
        expect(screen.getByText('Fake Sample :D')).toBeInTheDocument();
    });

    it('Search and Filter displays no records for no matches successfully', async () => {
        await renderAndWait(<DataManagementPage />);

        const isolateDetailTabButton = screen.getByRole('button', { name: 'Isolates Detail'});
        await userEvent.click(isolateDetailTabButton);
        await userEvent.type(screen.getByPlaceholderText('Search records...'), 'nonexistent');

        expect(screen.getByText('No sample records match active filters or search terms.')).toBeInTheDocument();
    });

    it('Search and Filters location successfully by search', async () => {
        mockedGetAllSites.mockResolvedValue(mockSiteResponse([
            mockSite,
            { ...mockSite, id: 2, geoLocName: 'Imposter Site'},
        ]) as any);
        await renderAndWait(<DataManagementPage />);

        const searchComponent = screen.getByPlaceholderText('Search locations...')
        await userEvent.type(searchComponent, 'Mock');

        expect(screen.getByText('Mock Geo Loc Name')).toBeInTheDocument();
        expect(screen.queryByText('Imposter Site')).not.toBeInTheDocument();
    });

    it('Search and Filters samples successfully by search', async () => {
        mockedGetAllSites.mockResolvedValue(mockSiteResponse([
            mockSite,
            { ...mockSite, id: 2, sampleName: 'Imposter Sample', geoLocName: 'Imposter Site' },
        ]) as any);
        await renderAndWait(<DataManagementPage />);

        const isolateDetailTabButton = screen.getByRole('button', { name: 'Isolates Detail'});
        await userEvent.click(isolateDetailTabButton);
        const searchComponent = screen.getByPlaceholderText('Search records...')
        await userEvent.type(searchComponent, 'Fake');

        expect(screen.getByText('Fake Sample :D')).toBeInTheDocument();
    });

    it('Successfully selects a location when record is clicked', async () => {
        mockedGetAllSites.mockResolvedValue(mockSiteResponse([
            mockSite,
        ]) as any);
        await renderAndWait(<DataManagementPage />);

        const recordToSelect = screen.getByText('Mock Geo Loc Name');
        await userEvent.click(recordToSelect);

        const checkboxComponent = screen.getAllByRole('checkbox')[1];
        expect((checkboxComponent as HTMLInputElement).checked).toBe(true);
    });

    it('Successfully selects all locations when record is clicked', async () => {
        await renderAndWait(<DataManagementPage />);

        const checkboxComponent = screen.getAllByRole('checkbox')[0];
        await userEvent.click(checkboxComponent);
        const allCheckboxComponent = screen.getAllByRole('checkbox');
        allCheckboxComponent.slice(1).forEach(checkbox => {
            expect((checkbox as HTMLInputElement).checked).toBe(true);
        });
    });

    it('Successfully selects a location when record is clicked', async () => {
        await renderAndWait(<DataManagementPage />);

        const isolateDetailTabButton = screen.getByRole('button', { name: 'Isolates Detail'});
        await userEvent.click(isolateDetailTabButton);
        const recordToSelect = screen.getByText('Mock Geo Loc Name');
        await userEvent.click(recordToSelect);

        const checkboxComponent = screen.getAllByRole('checkbox')[1];
        expect((checkboxComponent as HTMLInputElement).checked).toBe(true);
    });

    describe('Add Form', () =>{
        it('Successfully displays Add Record form when button is clicked', async () => {
            await renderAndWait(<DataManagementPage />);

            const addRecordButton = screen.getByRole('button', { name: 'Add Record'});
            await userEvent.click(addRecordButton);
            expect(screen.getByText('Add New Isolate Sample')).toBeInTheDocument();
        });

        it('Submit button when adding a record disabled if required fields are empty', async () => {
            await renderAndWait(<DataManagementPage />);

            const addRecordButton = screen.getByRole('button', { name: 'Add Record'});
            await userEvent.click(addRecordButton);
            expect(screen.getByRole('button', { name: 'Submit Record'})).toBeDisabled();
        });

        it('Submit button when adding a record enabled if required fields are filled', async () => {
            await renderAndWait(<DataManagementPage />);

            const addRecordButton = screen.getByRole('button', { name: 'Add Record'});
            await userEvent.click(addRecordButton);

            const fieldComponent = screen.getByPlaceholderText('Apies River - Site A')
            await userEvent.type(fieldComponent, 'Test Sample');
            const fieldComponent2 = screen.getByPlaceholderText('Site A')
            await userEvent.type(fieldComponent2, 'Test Location');
            const dateComponent = document.querySelector('input[type="date"]') as HTMLInputElement;
            await userEvent.type(dateComponent, '2026-01-01');

            expect(screen.getByRole('button', { name: 'Submit Record'})).not.toBeDisabled();
        });

        it('Successfully submits and displays toast', async () => {
            mockedAddSiteData.mockResolvedValue({ status:201 } as any);
            await renderAndWait(<DataManagementPage />);

            const addRecordButton = screen.getByRole('button', { name: 'Add Record'});
            await userEvent.click(addRecordButton);

            const fieldComponent = screen.getByPlaceholderText('Apies River - Site A')
            await userEvent.type(fieldComponent, 'Test Sample');
            const fieldComponent2 = screen.getByPlaceholderText('Site A')
            await userEvent.type(fieldComponent2, 'Test Location');
            const dateComponent = document.querySelector('input[type="date"]') as HTMLInputElement;
            await userEvent.type(dateComponent, '2026-01-01');
            const submitButton = screen.getByRole('button', { name: 'Submit Record'});
            await userEvent.click(submitButton);

            expect(mockedAddSiteData).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Site data added successfully!');
        });

        it('Displays error toast if add data fails', async () => {
            mockedAddSiteData.mockResolvedValue({ status:500 } as any);
            await renderAndWait(<DataManagementPage />);

            const addRecordButton = screen.getByRole('button', { name: 'Add Record'});
            await userEvent.click(addRecordButton);

            const fieldComponent = screen.getByPlaceholderText('Apies River - Site A')
            await userEvent.type(fieldComponent, 'Test Sample');
            const fieldComponent2 = screen.getByPlaceholderText('Site A')
            await userEvent.type(fieldComponent2, 'Test Location');
            const dateComponent = document.querySelector('input[type="date"]') as HTMLInputElement;
            await userEvent.type(dateComponent, '2026-01-01');
            const submitButton = screen.getByRole('button', { name: 'Submit Record'});
            await userEvent.click(submitButton);

            expect(mockedAddSiteData).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalledWith('Failed to add site data. Please try again.');
        });

        it('Displays WQI score when water params entered', async () => {
            await renderAndWait(<DataManagementPage />);

            const addRecordButton = screen.getByRole('button', { name: 'Add Record'});
            await userEvent.click(addRecordButton);
            await act(async () => {
                fireEvent.change(screen.getByPlaceholderText('7.0'), { target: { value: '7.0' } });
                fireEvent.change(screen.getByPlaceholderText('20.0'), { target: { value: '20.0' } });
                fireEvent.change(screen.getByPlaceholderText('8.0'), { target: { value: '8.0' } });
                fireEvent.change(screen.getByPlaceholderText('150'), { target: { value: '150' } });
            });

            expect(screen.queryByText('—')).not.toBeInTheDocument();
        });

        it('Closes Add Data form when cancel is clicked', async () => {
            await renderAndWait(<DataManagementPage />);

            const addRecordButton = screen.getByRole('button', { name: 'Add Record'});
            await userEvent.click(addRecordButton);
            const cancelButton = screen.getByRole('button', { name: 'Cancel'});
            await userEvent.click(cancelButton);

            expect(screen.getByText('Administrative Data Management')).toBeInTheDocument();
        });
    });

    describe('Update Form', () =>{
        it('Successfully displays Edit Record form with filled data when button is clicked', async () => {
            await renderAndWait(<DataManagementPage />);

            const isolateDetailTabButton = screen.getByRole('button', { name: 'Isolates Detail'});
            await userEvent.click(isolateDetailTabButton);
            const editRecordButton = screen.getByRole('button', { name: 'Edit'});
            await userEvent.click(editRecordButton);
            expect(screen.getByText('Edit Isolate Record')).toBeInTheDocument();

            const fieldComponent = screen.getByPlaceholderText('Apies River - Site A') as HTMLInputElement;
            expect(fieldComponent.value).toBe('Fake Sample :D');
        });

        it('Successfully updates and displays toast', async () => {
            mockedUpdateSite.mockResolvedValue({ ok: true } as any);
            await renderAndWait(<DataManagementPage />);

            const isolateDetailTabButton = screen.getByRole('button', { name: 'Isolates Detail'});
            await userEvent.click(isolateDetailTabButton);
            const editRecordButton = screen.getByRole('button', { name: 'Edit'});
            await userEvent.click(editRecordButton);
            const fieldComponent2 = screen.getByPlaceholderText('Site A')
            await userEvent.type(fieldComponent2, 'Test Location');
            const saveButton = screen.getByRole('button', { name: 'Save Changes'});
            await userEvent.click(saveButton);

            expect(mockedUpdateSite).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Isolate record updated successfully!');
        });

        it('Displays error toast if add data fails', async () => {
            mockedUpdateSite.mockResolvedValue({ ok: false } as any);
            await renderAndWait(<DataManagementPage />);

            const isolateDetailTabButton = screen.getByRole('button', { name: 'Isolates Detail'});
            await userEvent.click(isolateDetailTabButton);
            const editRecordButton = screen.getByRole('button', { name: 'Edit'});
            await userEvent.click(editRecordButton);
            const saveButton = screen.getByRole('button', { name: 'Save Changes'});
            await userEvent.click(saveButton);

            expect(mockedUpdateSite).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalledWith('Failed to update isolate record.');
        });

        it('Closes Add Data form when cancel is clicked', async () => {
            await renderAndWait(<DataManagementPage />);

            const isolateDetailTabButton = screen.getByRole('button', { name: 'Isolates Detail'});
            await userEvent.click(isolateDetailTabButton);
            const editRecordButton = screen.getByRole('button', { name: 'Edit'});
            await userEvent.click(editRecordButton);
            const cancelButton = screen.getByRole('button', { name: 'Cancel'});
            await userEvent.click(cancelButton);

            expect(screen.getByText('Administrative Data Management')).toBeInTheDocument();
        });
    });

    describe('Import', () =>{
        it('Successfully displays import dropdown when button is clicked', async () => {
            await renderAndWait(<DataManagementPage />);

            const importFileButton = screen.getByRole('button', { name: 'Import File'});
            await userEvent.click(importFileButton);

            expect(screen.getByRole('button', { name: 'CSV (.csv)'})).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'TSV (.tsv)'})).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'JSON (.json)'})).toBeInTheDocument();
        });

        it('Successfully imports file and displays toast', async () => {
            mockedAddMultipleSiteData.mockResolvedValue({ status: 201 } as any);
            await renderAndWait(<DataManagementPage />);

            const testFile = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv'});
            const fileInput = document.querySelector('input[type="file"][class="hidden"]') as HTMLInputElement;
            const importFileButton = screen.getByRole('button', { name: 'Import File'});
            await userEvent.click(importFileButton);
            await userEvent.upload(fileInput, testFile);
            const confirmButton = screen.getByRole('button', { name: 'Confirm Upload'});
            await userEvent.click(confirmButton);

            expect(toast.success).toHaveBeenCalledWith('Bulk data imported successfully!');
        });

        it('Displays error toast when import file fails', async () => {
            mockedAddMultipleSiteData.mockResolvedValue({ status: 500 } as any);
            await renderAndWait(<DataManagementPage />);

            const testFile = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv'});
            const fileInput = document.querySelector('input[type="file"][class="hidden"]') as HTMLInputElement;
            const importFileButton = screen.getByRole('button', { name: 'Import File'});
            await userEvent.click(importFileButton);
            await userEvent.upload(fileInput, testFile);
            const confirmButton = screen.getByRole('button', { name: 'Confirm Upload'});
            await userEvent.click(confirmButton);

            expect(toast.error).toHaveBeenCalledWith('Failed to import bulk file data.');
        });

        it('Closes upload when cancel is clicked', async () => {
            await renderAndWait(<DataManagementPage />);

            const testFile = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv'});
            const fileInput = document.querySelector('input[type="file"][class="hidden"]') as HTMLInputElement;
            const importFileButton = screen.getByRole('button', { name: 'Import File'});
            await userEvent.click(importFileButton);
            await userEvent.upload(fileInput, testFile);
            const cancelButton = screen.getByRole('button', { name: 'Cancel Upload'});
            await userEvent.click(cancelButton);

            expect(screen.getByText('Administrative Data Management')).toBeInTheDocument();
        });
    });

    describe('Delete', () =>{
        it('Successfully displays Delete dropdown when button is clicked', async () => {
            await renderAndWait(<DataManagementPage />);

            const deleteButton = screen.getByRole('button', { name: 'Delete'});
            await userEvent.click(deleteButton);

            expect(screen.getByText('By Date Range')).toBeInTheDocument();
            expect(screen.getByText('By Selected Locations (0)')).toBeInTheDocument();
            expect(screen.getByText('By Selected Samples (0)')).toBeInTheDocument();
            expect(screen.getByText('System Reset (All)')).toBeInTheDocument();
        });

        it('Displays Delete All popup when system reset clicked', async () => {
            await renderAndWait(<DataManagementPage />);

            const deleteButton = screen.getByRole('button', { name: 'Delete'});
            await userEvent.click(deleteButton);
            const resetButton = screen.getByText('System Reset (All)');
            await userEvent.click(resetButton);

            expect(screen.getByText('Critical Database Reset')).toBeInTheDocument();
        });

        it('Confirm delete is disabled til correct text entered', async () => {
            await renderAndWait(<DataManagementPage />);

            const deleteButton = screen.getByRole('button', { name: 'Delete'});
            await userEvent.click(deleteButton);
            const resetButton = screen.getByText('System Reset (All)');
            await userEvent.click(resetButton);
            const confirmBUtton = screen.getByRole('button', { name: 'Confirm Wipe'});
            expect(confirmBUtton).toBeDisabled();
            const confirmComponent = screen.getByPlaceholderText('Verification text...');
            await userEvent.type(confirmComponent, 'DELETE ALL DATA');

            expect(confirmBUtton).not.toBeDisabled();
        });

        it('Successfully deletes and displays toast', async () => {
            mockedFetch.mockResolvedValue({ 
                ok:true,
                json: async () => ({ message: 'All data deleted'}) 
            } as any);
            await renderAndWait(<DataManagementPage />);

            const deleteButton = screen.getByRole('button', { name: 'Delete'});
            await userEvent.click(deleteButton);
            const resetButton = screen.getByText('System Reset (All)');
            await userEvent.click(resetButton);
            const confirmComponent = screen.getByPlaceholderText('Verification text...');
            await userEvent.type(confirmComponent, 'DELETE ALL DATA');
            const confirmBUtton = screen.getByRole('button', { name: 'Confirm Wipe'});
            await userEvent.click(confirmBUtton);

            expect(mockedFetch).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('All data deleted');
        });

        it('Displays error toast if confirmation text is not correct', async () => {
            mockedFetch.mockResolvedValue({ 
                ok: false,
                json: async () => ({ message: 'All data deleted'}) 
            } as any);
            await renderAndWait(<DataManagementPage />);

            const deleteButton = screen.getByRole('button', { name: 'Delete'});
            await userEvent.click(deleteButton);
            const resetButton = screen.getByText('System Reset (All)');
            await userEvent.click(resetButton);
            const confirmComponent = screen.getByPlaceholderText('Verification text...');
            await userEvent.type(confirmComponent, 'DELETE ALL');

            const confirmBUtton = screen.getByRole('button', { name: 'Confirm Wipe'});
            expect(confirmBUtton).toBeDisabled();
        });


        it('Displays error toast if delete data fails', async () => {
            mockedFetch.mockResolvedValue({ 
                ok: false,
                json: async () => ({ message: 'All data deleted'}) 
            } as any);
            await renderAndWait(<DataManagementPage />);

            const deleteButton = screen.getByRole('button', { name: 'Delete'});
            await userEvent.click(deleteButton);
            const resetButton = screen.getByText('System Reset (All)');
            await userEvent.click(resetButton);
            const confirmComponent = screen.getByPlaceholderText('Verification text...');
            await userEvent.type(confirmComponent, 'DELETE ALL DATA');
            const confirmBUtton = screen.getByRole('button', { name: 'Confirm Wipe'});
            await userEvent.click(confirmBUtton);

            expect(mockedFetch).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalledWith('Bulk deletion failed');
        });

        it('Closes popup if cancel is clicked', async () => {
            mockedFetch.mockResolvedValue({ 
                ok: false,
                json: async () => ({ message: 'All data deleted'}) 
            } as any);
            await renderAndWait(<DataManagementPage />);

            const deleteButton = screen.getByRole('button', { name: 'Delete'});
            await userEvent.click(deleteButton);
            const resetButton = screen.getByText('System Reset (All)');
            await userEvent.click(resetButton);
            const cancelButton = screen.getByRole('button', { name: 'Cancel'});
            await userEvent.click(cancelButton);

            expect(screen.queryByText('Critical Database Reset')).not.toBeInTheDocument();
        });

        it('Displays Delete by Date Range popup when clicked', async () => {
            await renderAndWait(<DataManagementPage />);

            const deleteButton = screen.getByRole('button', { name: 'Delete'});
            await userEvent.click(deleteButton);
            const byDateButton = screen.getByText('By Date Range');
            await userEvent.click(byDateButton);

            expect(screen.getByText('Delete by Date Range')).toBeInTheDocument();
        });

        it('Delete button for Delete by Date Range popup if no dates selected', async () => {
            await renderAndWait(<DataManagementPage />);

            const deleteButton = screen.getByRole('button', { name: 'Delete'});
            await userEvent.click(deleteButton);
            const byDateButton = screen.getByText('By Date Range');
            await userEvent.click(byDateButton);

            expect(screen.getByRole('button', { name: 'Delete Data'})).toBeDisabled();
        });

        it('Successfully deletes by Date Range popup', async () => {
            mockedFetch.mockResolvedValue({ 
                ok: true,
                json: async () => ({ message: 'Data deleted'}) 
            } as any);
            await renderAndWait(<DataManagementPage />);

            const deleteButton = screen.getByRole('button', { name: 'Delete'});
            await userEvent.click(deleteButton);
            const byDateButton = screen.getByText('By Date Range');
            await userEvent.click(byDateButton);
            const dateInputComponents = document.querySelectorAll('input[type="date"]');
            await userEvent.type(dateInputComponents[0] as HTMLElement, '2026-01-01');
            const deleteDataButton = screen.getByRole('button', { name: 'Delete Data'});
            await userEvent.click(deleteDataButton);

            expect(mockedFetch).toHaveBeenCalled();
        });

        it('Displays Delete by locations popup when clicked', async () => {
            await renderAndWait(<DataManagementPage />);

            const recordToSelect = screen.getByText('Mock Geo Loc Name');
            await userEvent.click(recordToSelect); 
            const checkboxComponent = screen.getAllByRole('checkbox')[1] as HTMLInputElement;
            expect((checkboxComponent as HTMLInputElement).checked).toBe(true);
            const deleteButton = screen.getByRole('button', { name: 'Delete'});
            await userEvent.click(deleteButton);
            const byLocationsButton = screen.getByText('By Selected Locations (1)');
            expect(byLocationsButton).not.toBeDisabled();
            await userEvent.click(byLocationsButton);

            expect(screen.getByText('Delete Locations')).toBeInTheDocument();
        });


    });

})
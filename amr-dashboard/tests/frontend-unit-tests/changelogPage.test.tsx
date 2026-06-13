import { act, render,screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { default: ChangeLogPage } = require("@/app/changelog/page");
import { toast } from "react-toastify";

global.fetch = jest.fn();
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

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

Object.defineProperty(document, 'cookie', {
    writable: true,
    value: 'token=mock-token',
});

const mockEntry = (overrides = {}): any => ({
    id: 1,
    action: 'CREATE',
    entityId: 101,
    previousData: null,
    newData: JSON.stringify({ sampleName: 'Fake name', organism: 'fake organism', ph: 1 }),
    undone: false,
    createdAt: '2024-06-01T10:00:00Z',
    admin: { id: 1, name: 'Admin User', email: 'admin@test.com' },
    ...overrides,
});
const mockResponse = (entries: any[], total = entries.length): any => ({
    ok: true,
    json: async () => ({
        data: entries,
        total,
        page: 1,
        limit: 20,
    }),
});

const renderAndWait = async (ui: React.ReactElement) => {
    let result: any;
    await act(async () => {
        result = render(ui);
    });
    return result;
};

describe("Change Log Page Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockedFetch.mockResolvedValue(mockResponse([]));
    });

    it("Renders Changelog Page Successfully", async () => {
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('Change Log')).toBeInTheDocument();
        expect(screen.getByText('Track and undo data modifications')).toBeInTheDocument();
        expect(screen.getByTitle('Refresh Data')).toBeInTheDocument();
        expect(screen.getByText('Action Type')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByText('0 total records')).toBeInTheDocument();
        expect(screen.getByText('No changes recorded yet')).toBeInTheDocument();
    });

    it("Renders Records Successfully", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry()], 42));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('42 total records')).toBeInTheDocument();
    });

    it("Displays CREATE entry Successfully", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({ action: 'CREATE', entityId: 1 })]));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('SiteData #1')).toBeInTheDocument();
        expect(screen.getByText('By Admin User')).toBeInTheDocument();
        const badge = screen.getAllByText('CREATE').find(el => el.tagName === 'SPAN');
        expect(badge).toBeInTheDocument();
    });

    it("Displays UPDATE entry Successfully", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({ action: 'UPDATE', entityId: 1 })]));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('SiteData #1')).toBeInTheDocument();
        expect(screen.getByText('By Admin User')).toBeInTheDocument();
        const badge = screen.getAllByText('UPDATE').find(el => el.tagName === 'SPAN');
        expect(badge).toBeInTheDocument();
    });

    it("Displays DELETE entry Successfully", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({ action: 'DELETE', entityId: 1 })]));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('SiteData #1')).toBeInTheDocument();
        expect(screen.getByText('By Admin User')).toBeInTheDocument();
        const badge = screen.getAllByText('DELETE').find(el => el.tagName === 'SPAN');
        expect(badge).toBeInTheDocument();
    });

    it("Displays UNDO_CREATE entry Successfully", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({ action: 'UNDO_CREATE', entityId: 1 })]));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('SiteData #1')).toBeInTheDocument();
        expect(screen.getByText('By Admin User')).toBeInTheDocument();
        const badge = screen.getAllByText('UNDO CREATE').find(el => el.tagName === 'SPAN');
        expect(badge).toBeInTheDocument();
    });

    it("Displays UNDO_UPDATE entry Successfully", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({ action: 'UNDO_UPDATE', entityId: 1 })]));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('SiteData #1')).toBeInTheDocument();
        expect(screen.getByText('By Admin User')).toBeInTheDocument();
        const badge = screen.getAllByText('UNDO UPDATE').find(el => el.tagName === 'SPAN');
        expect(badge).toBeInTheDocument();
    });

    it("Displays UNDO_DELETE entry Successfully", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({ action: 'UNDO_DELETE', entityId: 1 })]));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('SiteData #1')).toBeInTheDocument();
        expect(screen.getByText('By Admin User')).toBeInTheDocument();
        const badge = screen.getAllByText('UNDO DELETE').find(el => el.tagName === 'SPAN');
        expect(badge).toBeInTheDocument();
    });

    it("Displays BULK_CREATE entry Successfully", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({
            action: 'BULK_CREATE',
            newData: JSON.stringify([{ sampleName: 'Sample A' }, { sampleName: 'Sample B'}, { sampleName: 'Sample C' }]), 
            previousData: null })]));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('BULK CREATE (3 records)')).toBeInTheDocument();
    });

    it("Displays multiple entries Successfully", async () => {
        mockedFetch.mockResolvedValue(mockResponse([
            mockEntry({ action: 'CREATE', entityId: 1 }),
            mockEntry({ action: 'UPDATE', entityId: 2 }),
            mockEntry({ action: 'DELETE', entityId: 3 }),
            mockEntry({ action: 'CREATE', entityId: 4 }),
        ]));
        
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('SiteData #1')).toBeInTheDocument();
        expect(screen.getByText('SiteData #2')).toBeInTheDocument();
        expect(screen.getByText('SiteData #3')).toBeInTheDocument();
        expect(screen.getByText('SiteData #4')).toBeInTheDocument();
    });
    
    it('Displays new data table successfully when CREATE entry is expanded', async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({
            action: 'CREATE',
            newData: JSON.stringify({ sampleName: 'New sample', ph: 1, organism: 'Faked 2' }),
            previousData: null,
        })]));
        await renderAndWait(<ChangeLogPage />);

        const expandButton = screen.getByRole('button', { name: '' });
        await userEvent.click(expandButton);

        expect(screen.getByText('New Data')).toBeInTheDocument();
        expect(screen.getByText('sampleName')).toBeInTheDocument();
        expect(screen.getByText('New sample')).toBeInTheDocument();
        expect(screen.getByText('ph')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('Displays deleted data table successfully when DELETE entry is expanded', async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({
            action: 'DELETE',
            newData: null,
            previousData: JSON.stringify({ sampleName: 'New sample', ph: 1, organism: 'Faked 2' }),
        })]));
        await renderAndWait(<ChangeLogPage />);

        const expandButton = screen.getByRole('button', { name: '' });
        await userEvent.click(expandButton);

        expect(screen.getByText('Deleted Data')).toBeInTheDocument();
        expect(screen.getByText('sampleName')).toBeInTheDocument();
        expect(screen.getByText('New sample')).toBeInTheDocument();
        expect(screen.getByText('ph')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('Displays update data table successfully when UPDATED entry is expanded', async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({
            action: 'UPDATE',
            newData: JSON.stringify({sampleName: 'New sample', ph: 1, organism: 'Faked 2' }),
            previousData: JSON.stringify({ sampleName: 'New sample', ph: 2, organism: 'Faked 2.1' }),
        })]));
        await renderAndWait(<ChangeLogPage />);

        const expandButton = screen.getByRole('button', { name: '' });
        await userEvent.click(expandButton);

        expect(screen.getByText('Changes')).toBeInTheDocument();
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.getByText('ph')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('Displays bulk create table when BULK_CREATE entry is expanded', async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({
            action: 'BULK_CREATE',
            newData: JSON.stringify([
                { sampleName: 'Sample A' , organism: 'fake', ph: 7}, 
                { sampleName: 'Sample B', organism: 'other', ph: 8},
                { sampleName: 'Sample C', organism: 'other 2', ph: 9 }]),
            previousData: null,
        })]));
        await renderAndWait(<ChangeLogPage />);

        const expandButton = screen.getByRole('button', { name: '' });
        await userEvent.click(expandButton);

        expect(screen.getByText('Created Water Samples (3 records)')).toBeInTheDocument();
        expect(screen.getByText('Sample A')).toBeInTheDocument();
        expect(screen.getByText('Sample B')).toBeInTheDocument();
        expect(screen.getByText('Sample C')).toBeInTheDocument();
        expect(screen.getByText('fake')).toBeInTheDocument();
    });

    it('Displays bulk delete table when DELETE entry is expanded', async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({
            action: 'BULK_DELETE',
            newData: null,
            previousData: JSON.stringify([
                { sampleName: 'Sample A' , organism: 'fake', ph: 7}, 
                { sampleName: 'Sample B', organism: 'other', ph: 8},
                { sampleName: 'Sample C', organism: 'other 2', ph: 9 }]),
        })]));
        await renderAndWait(<ChangeLogPage />);

        const expandButton = screen.getByRole('button', { name: '' });
        await userEvent.click(expandButton);

        expect(screen.getByText('Deleted Water Samples (3 records)')).toBeInTheDocument();
        expect(screen.getByText('Sample A')).toBeInTheDocument();
        expect(screen.getByText('Sample B')).toBeInTheDocument();
        expect(screen.getByText('Sample C')).toBeInTheDocument();
        expect(screen.getByText('fake')).toBeInTheDocument();
    });

    it('Displays no data when entry has no data', async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({
            action: 'CREATE',
            newData: null,
            previousData: null,
        })]));
        await renderAndWait(<ChangeLogPage />);

        const expandButton = screen.getByRole('button', { name: '' });
        await userEvent.click(expandButton);

        expect(screen.getByText('No data available for this entry.')).toBeInTheDocument();
    });

    it('Collapses entry when expand button is clicked again', async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({
            action: 'CREATE',
            newData: JSON.stringify({ sampleName: 'Sample A', ph: 1, organism: 'fake' }),
            previousData: null,
        })]));
        await renderAndWait(<ChangeLogPage />);

        const expandButton = screen.getByRole('button', { name: '' });
        await userEvent.click(expandButton);

        expect(screen.getByText('New Data')).toBeInTheDocument();
        expect(screen.getByText('sampleName')).toBeInTheDocument();
        expect(screen.getByText('Sample A')).toBeInTheDocument();
        expect(screen.getByText('ph')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();

        await userEvent.click(expandButton);
        expect(screen.queryByText('New Data')).not.toBeInTheDocument();
    });

    it("Pagination not implemented if all entries fit on 1 page", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry()], 2));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it("Pagination implemented if all entries do not fit on 1 page", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry()], 100));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it("Ellipsis displayed for large page counts", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry()], 200));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('...')).toBeInTheDocument();
    });

    it("Filters default to 'All Actions'", async () => {
        await renderAndWait(<ChangeLogPage />);

        const combobox = screen.getByRole('combobox');
        const comboboxOptions = Array.from(combobox.querySelectorAll('option')).map(option => option.value);
        expect(comboboxOptions).toEqual(expect.arrayContaining(['All', 'CREATE', 'UPDATE', 'DELETE', 'BULK_CREATE', 'BULK_DELETE']));

        expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('All');
    });

    it("Filters work correctly", async () => {
        await renderAndWait(<ChangeLogPage />);

        const combobox = screen.getByRole('combobox');
        await userEvent.selectOptions(combobox, 'CREATE');

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('action=CREATE'),
            expect.anything()
        )
    });

    it("Page reset to 1 when filters applied", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry()], 200));
        await renderAndWait(<ChangeLogPage />);

        await userEvent.click(screen.getByText('2'));

        const combobox = screen.getByRole('combobox');
        await userEvent.selectOptions(combobox, 'CREATE');

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('page=1'),
            expect.anything()
        )
    });

    it("Refreshes data successfully when refresh button clicked", async () => {
        await renderAndWait(<ChangeLogPage />);

        const refreshButton = screen.getByTitle('Refresh Data');
        await userEvent.click(refreshButton);

        expect(mockedFetch).toHaveBeenCalledTimes(2)
    });

    it("Displays admin name when available", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({ admin: { name: 'Admin User' } })]));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.getByText('By Admin User')).toBeInTheDocument();
    });

    it("Does not display admin name when not available", async () => {
        mockedFetch.mockResolvedValue(mockResponse([mockEntry({ admin: null })]));
        await renderAndWait(<ChangeLogPage />);

        expect(screen.queryByText('By Admin User')).not.toBeInTheDocument();
    });
});
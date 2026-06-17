import { act, render,screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { default: VisualizationsPage } = require("@/app/visualizations/page");
import { exportStatistics } from "@/functions/statistics/exportData";
import { useStatistics } from '@/components/StatisticsContext';
import { toast } from "react-toastify";

global.fetch = jest.fn();
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;
jest.mock('@/functions/statistics/exportData', () => ({
    exportStatistics: jest.fn(),
}));

jest.mock("react-toastify", () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

const mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
    useSearchParams: () => mockSearchParams,
}));

const mockedExport = exportStatistics as jest.MockedFunction<typeof exportStatistics>;
const mockedUseStatistics = useStatistics as jest.MockedFunction<typeof useStatistics>;

jest.mock('@/components/TimeSeriesDashboard', () => () => <div data-testid="mock-timeseries" />);
jest.mock('@/components/IndependentGraph', () => ({ config }: any) => <div data-testid={`mock-graph-${config.id}`} />);
jest.mock('@/components/StatisticsFilterPanel', () => () => <div data-testid="mock-filter-panel" />);
jest.mock('@/components/StatisticsContext', () => ({
    StatisticsProvider: ({ children }: any) => <div>{children}</div>,
    useStatistics: jest.fn(),
}));

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
const mockAllSitesResponse = () => ({
    ok: true,
    json: async () => ({ sites: [mockSite] }),
});

const mockSiteResponse = () => ({
    ok: true,
    json: async () => ({ site: mockSite }),
});

const mockWaterQualityResponse = (wqi = 75) => ({
    ok: true,
    json: async () => ({ results: [{ WQI: wqi }] }),
});

const mockAnomalyResponse = (anomalies: any[] = []) => ({
    ok: true,
    json: async () => anomalies,
});

const renderAndWait = async (ui: React.ReactElement) => {
    let result: any;
    await act(async () => {
        result = render(ui);
    });
    return result;
};
const setSearchParams = (params: Record<string, string>) => {
    Object.keys(params).forEach(key => mockSearchParams.set(key, params[key]));
};

const clearSearchParams = () => {
    mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
};

describe("Visualizations Page Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        clearSearchParams();
        mockedFetch.mockResolvedValue(mockAllSitesResponse() as any);
        mockedUseStatistics.mockReturnValue({
            graphs: [],
            activeGraphId: null,
            addGraph: jest.fn(),
            removeGraph: jest.fn(),
            updateGraph: jest.fn(),
            setActiveGraph: jest.fn(),
        });
    });

    it("Loads Visualizations Page Successfully", async () => {
        mockedFetch.mockImplementation(() => new Promise(() => {}));
        await renderAndWait(<VisualizationsPage />);

        expect(screen.getByText("Initializing Visualizations Engine...")).toBeInTheDocument();
    });

    it("Renders Visualizations Page Successfully", async () => {
        await renderAndWait(<VisualizationsPage />);

        expect(screen.getByRole("button", { name: "Add New Visualization" })).toBeInTheDocument();
        expect(screen.getByText("No active visualizations. Click above to get started.")).toBeInTheDocument();
    });

    it("Renders graphs successfully", async () => {
        const { useStatistics } = require('@/components/StatisticsContext');
        useStatistics.mockReturnValue({
            graphs: [{ id: 'graph1' }, { id: 'graph2'}],
            activeGraphId: 'graph1',
            addGraph: jest.fn(),
        })
        await renderAndWait(<VisualizationsPage />);

        expect(screen.getByTestId("mock-graph-graph1")).toBeInTheDocument();
        expect(screen.getByTestId("mock-graph-graph2")).toBeInTheDocument();
    });

    it("Calls addGraph when 'Add New Visualization' button is clicked", async () => {
        const mockedAddGraph = jest.fn();
        const { useStatistics } = require('@/components/StatisticsContext');
        useStatistics.mockReturnValue({
            graphs: [],
            activeGraphId: null,
            addGraph: mockedAddGraph,
        })
        await renderAndWait(<VisualizationsPage />);

        const addNewVisualizationButton = screen.getByRole("button", { name: "Add New Visualization" });
        await userEvent.click(addNewVisualizationButton);

        expect(mockedAddGraph).toHaveBeenCalled();
    });

    it("Renders sites stats successfully", async () => {
        setSearchParams({ site: '1', location: 'Test Location' });
        mockedFetch
            .mockResolvedValueOnce(mockAllSitesResponse() as any)
            .mockResolvedValueOnce(mockSiteResponse() as any)
            .mockResolvedValueOnce(mockWaterQualityResponse() as any)
            .mockResolvedValueOnce(mockAnomalyResponse() as any);

        await renderAndWait(<VisualizationsPage />);

        expect(screen.getByText("Test Location - Visualizations")).toBeInTheDocument();
        expect(screen.getByTestId('mock-timeseries')).toBeInTheDocument();
        expect(screen.getByText('Samples')).toBeInTheDocument();
        expect(screen.getByText('Avg pH')).toBeInTheDocument();
        expect(screen.getByText('Avg Temp')).toBeInTheDocument();
        expect(screen.getByText('Avg DO')).toBeInTheDocument();
        expect(screen.getByText('Parameter Averages')).toBeInTheDocument();
        expect(screen.getByText('Temperature')).toBeInTheDocument();
        expect(screen.getByText('pH Level')).toBeInTheDocument();
        expect(screen.getByText('Dissolved O₂')).toBeInTheDocument();
        expect(screen.getByText('TDS')).toBeInTheDocument();

        expect(screen.getByRole('link', {name: 'View Samples & Geolocations'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Export'})).toBeInTheDocument();
    });

    it("Displays anomalies section when they exist", async () => {
        setSearchParams({ site: '1', location: 'Test Location' });
        mockedFetch
            .mockResolvedValueOnce(mockAllSitesResponse() as any)
            .mockResolvedValueOnce(mockSiteResponse() as any)
            .mockResolvedValueOnce(mockWaterQualityResponse() as any)
            .mockResolvedValueOnce(mockAnomalyResponse([
                { issues: 'High pH detected', changes: 2.5 },
                { issues: 'Low dissolved oxygen', changes: -1.2 },
            ]) as any);

        await renderAndWait(<VisualizationsPage />);

        expect(screen.getByText("Location Anomalies")).toBeInTheDocument();
        expect(screen.getByText('High pH detected')).toBeInTheDocument();
        expect(screen.getByText('Low dissolved oxygen')).toBeInTheDocument();
    });

    it("Does not display anomalies section when they do not exist", async () => {
        await renderAndWait(<VisualizationsPage />);

        expect(screen.queryByText("Location Anomalies")).not.toBeInTheDocument();
    });

    it("Displays export options when 'Export' button clicked", async () => {
        setSearchParams({ site: '1', location: 'Test Location' });
        mockedFetch
            .mockResolvedValueOnce(mockAllSitesResponse() as any)
            .mockResolvedValueOnce(mockSiteResponse() as any)
            .mockResolvedValueOnce(mockWaterQualityResponse() as any)
            .mockResolvedValueOnce(mockAnomalyResponse() as any);

        await renderAndWait(<VisualizationsPage />);

        const exportButton = screen.getByRole('button', {name: 'Export'});
        await userEvent.click(exportButton);

        expect(screen.getByText("Export as csv")).toBeInTheDocument();
        expect(screen.getByText('Export as tsv')).toBeInTheDocument();
        expect(screen.getByText('Export as json')).toBeInTheDocument();
    });

    it("Exports as correct format when 'Export' button clicked and csv is selected", async () => {
        setSearchParams({ site: '1', location: 'Test Location' });
        mockedFetch
            .mockResolvedValueOnce(mockAllSitesResponse() as any)
            .mockResolvedValueOnce(mockSiteResponse() as any)
            .mockResolvedValueOnce(mockWaterQualityResponse() as any)
            .mockResolvedValueOnce(mockAnomalyResponse() as any);
        mockedExport.mockReturnValueOnce({ status: 200 } as any);

        await renderAndWait(<VisualizationsPage />);

        const exportButton = screen.getByRole('button', {name: 'Export'});
        await userEvent.click(exportButton);
        const csvOption = screen.getByText("Export as csv");
        await userEvent.click(csvOption);

        expect(mockedExport).toHaveBeenCalledWith(
            expect.any(Array),
            'csv', 
            expect.stringContaining('site_'));
        expect(toast.success).toHaveBeenCalledWith("Statistics exported successfully");
    });

    it("Exports as correct format when 'Export' button clicked and tsv is selected", async () => {
        setSearchParams({ site: '1', location: 'Test Location' });
        mockedFetch
            .mockResolvedValueOnce(mockAllSitesResponse() as any)
            .mockResolvedValueOnce(mockSiteResponse() as any)
            .mockResolvedValueOnce(mockWaterQualityResponse() as any)
            .mockResolvedValueOnce(mockAnomalyResponse() as any);
        mockedExport.mockReturnValueOnce({ status: 200 } as any);

        await renderAndWait(<VisualizationsPage />);

        const exportButton = screen.getByRole('button', {name: 'Export'});
        await userEvent.click(exportButton);
        const tsvOption = screen.getByText("Export as tsv");
        await userEvent.click(tsvOption);

        expect(mockedExport).toHaveBeenCalledWith(
            expect.any(Array),
            'tsv', 
            expect.stringContaining('site_'));
        expect(toast.success).toHaveBeenCalledWith("Statistics exported successfully");
    });

    it("Exports as correct format when 'Export' button clicked and json is selected", async () => {
        setSearchParams({ site: '1', location: 'Test Location' });
        mockedFetch
            .mockResolvedValueOnce(mockAllSitesResponse() as any)
            .mockResolvedValueOnce(mockSiteResponse() as any)
            .mockResolvedValueOnce(mockWaterQualityResponse() as any)
            .mockResolvedValueOnce(mockAnomalyResponse() as any);
        mockedExport.mockReturnValueOnce({ status: 200 } as any);

        await renderAndWait(<VisualizationsPage />);

        const exportButton = screen.getByRole('button', {name: 'Export'});
        await userEvent.click(exportButton);
        const jsonOption = screen.getByText("Export as json");
        await userEvent.click(jsonOption);

        expect(mockedExport).toHaveBeenCalledWith(
            expect.any(Array),
            'json', 
            expect.stringContaining('site_'));
        expect(toast.success).toHaveBeenCalledWith("Statistics exported successfully");
    });

    it("Displays error toast on failed export", async () => {
        setSearchParams({ site: '1', location: 'Test Location' });
        mockedFetch
            .mockResolvedValueOnce(mockAllSitesResponse() as any)
            .mockResolvedValueOnce(mockSiteResponse() as any)
            .mockResolvedValueOnce(mockWaterQualityResponse() as any)
            .mockResolvedValueOnce(mockAnomalyResponse() as any);
        mockedExport.mockReturnValueOnce({ status: 500 } as any);

        await renderAndWait(<VisualizationsPage />);

        const exportButton = screen.getByRole('button', {name: 'Export'});
        await userEvent.click(exportButton);
        const jsonOption = screen.getByText("Export as json");
        await userEvent.click(jsonOption);

        expect(toast.error).toHaveBeenCalledWith("Could not export statistics");
    });

    it("Hides export options after selecting a format", async () => {
        setSearchParams({ site: '1', location: 'Test Location' });
        mockedFetch
            .mockResolvedValueOnce(mockAllSitesResponse() as any)
            .mockResolvedValueOnce(mockSiteResponse() as any)
            .mockResolvedValueOnce(mockWaterQualityResponse() as any)
            .mockResolvedValueOnce(mockAnomalyResponse() as any);

        await renderAndWait(<VisualizationsPage />);

        const exportButton = screen.getByRole('button', {name: 'Export'});
        await userEvent.click(exportButton);

        expect(screen.getByText("Export as csv")).toBeInTheDocument();
        expect(screen.getByText('Export as tsv')).toBeInTheDocument();
        expect(screen.getByText('Export as json')).toBeInTheDocument();

        const jsonOption = screen.getByText("Export as json");
        await userEvent.click(jsonOption);

        expect(screen.queryByText("Export as csv")).not.toBeInTheDocument();
        expect(screen.queryByText('Export as tsv')).not.toBeInTheDocument();
        expect(screen.queryByText('Export as json')).not.toBeInTheDocument();
    });

    it("Fetches sites successfully", async () => {
        await renderAndWait(<VisualizationsPage />);

        expect(mockedFetch).toHaveBeenCalledWith('/api/site');
    });

    it("Fetches specific site data if siteId provided in search params", async () => {
        setSearchParams({ site: '1'});
        mockedFetch
            .mockResolvedValueOnce(mockAllSitesResponse() as any)
            .mockResolvedValueOnce(mockSiteResponse() as any)
            .mockResolvedValueOnce(mockWaterQualityResponse() as any)
            .mockResolvedValueOnce(mockAnomalyResponse() as any);

        await renderAndWait(<VisualizationsPage />);

        expect(mockedFetch).toHaveBeenCalledWith('/api/site');
        expect(mockedFetch).toHaveBeenCalledWith('/api/site/1');
        expect(mockedFetch).toHaveBeenCalledWith('/api/statistics/waterQuality?siteId=1');
        expect(mockedFetch).toHaveBeenCalledWith('/api/statistics/anomalyForSite?siteId=1');
    });

});
import { render,screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { default: HomePage } = require("@/app/home/page");
import { getAllSites } from "@/app/services/siteService";
import { toast } from "react-toastify";

jest.mock("@/app/services/siteService", () => ({
    getAllSites: jest.fn(),
}));
jest.mock("@/components/map/LoadMap", () => ({
    Map: () => <div data-testid="mock-map" />,
}));
jest.mock("@/components/OverviewCharts", () => () => <div data-testid="mock-charts" />);


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

const mockedGetAllSites = getAllSites as jest.MockedFunction<typeof getAllSites>;
const mockSite = {
    geoLocName: "Test Location",
    collectionDate: "2023-01-01",
    latitude: -20.7,
    longitude: 10.2,
    dangerZone: "green",
    dissolvedO2: 4,
    ph: 1,
    temperature: 20,
    tds: 100,
};

describe("Home Page Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetAllSites.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ sites: [] }),
        } as any);
    });

    it("Renders Home Page Successfully", () => {
        render(<HomePage />);

        //tab options
        expect(screen.getByRole("button", { name: "Interactive Spatial Mapping" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "List by Geo Location" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "List by Sample (All)" })).toBeInTheDocument();

        //filters
        expect(screen.getByText("Filter Panel")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Refresh Data" })).toBeInTheDocument();
        expect(screen.getByText("Temporal Coverage")).toBeInTheDocument();
        expect(screen.getByText("Start Date")).toBeInTheDocument();
        expect(screen.getByText("End Date")).toBeInTheDocument();
        const dateInputs = document.querySelectorAll('input[type="date"]');
        expect(dateInputs.length).toBe(2);
        expect(screen.getByText("Sample Sites Filter")).toBeInTheDocument();
        expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("Switches to 'Interactive Spatial Mapping' Tab successfully", async () => {
        render(<HomePage />);

        const mapTab = screen.getByRole("button", { name: "Interactive Spatial Mapping" });
        await userEvent.click(mapTab);

        expect(screen.getByRole("button", { name: "Interactive Spatial Mapping" })).toHaveClass("bg-white");
        expect(screen.getByRole("button", { name: "List by Geo Location" })).not.toHaveClass("bg-white");
        expect(screen.getByRole("button", { name: "List by Sample (All)" })).not.toHaveClass("bg-white");
    });

    it("Switches to 'List by Geo Location' Tab successfully", async () => {
        render(<HomePage />);

        const geolocTab = screen.getByRole("button", { name: "List by Geo Location" });
        await userEvent.click(geolocTab);

        expect(screen.getByRole("button", { name: "Interactive Spatial Mapping" })).not.toHaveClass("bg-white");
        expect(screen.getByRole("button", { name: "List by Geo Location" })).toHaveClass("bg-white");
        expect(screen.getByRole("button", { name: "List by Sample (All)" })).not.toHaveClass("bg-white");
    });

    it("Switches to 'List by Sample (All)' Tab successfully", async () => {
        render(<HomePage />);

        const sampleTab = screen.getByRole("button", { name: "List by Sample (All)" });
        await userEvent.click(sampleTab);

        expect(screen.getByRole("button", { name: "Interactive Spatial Mapping" })).not.toHaveClass("bg-white");
        expect(screen.getByRole("button", { name: "List by Geo Location" })).not.toHaveClass("bg-white");
        expect(screen.getByRole("button", { name: "List by Sample (All)" })).toHaveClass("bg-white");
    });

    it("Filters sites by temporal coverage successfully", async () => {
        mockedGetAllSites.mockResolvedValue({
            ok: true,
            json: async () => ({
                sites: [
                    { ...mockSite, collectionDate: "2022-01-15", latitude: 1, longitude: 1 },
                    { ...mockSite, collectionDate: "2023-06-15", latitude: 2, longitude: 2 },
                    { ...mockSite, collectionDate: "2024-12-15", latitude: 3, longitude: 3 },
                ],
            }),
        } as any);

        render(<HomePage />);

        const dateInputs = document.querySelectorAll('input[type="date"]');
        expect(dateInputs.length).toBe(2);

        //set start and end date
        await userEvent.type(dateInputs[0] as HTMLElement, "2022-01-01");
        await userEvent.type(dateInputs[1] as HTMLElement, "2024-01-01");
    });

    it("Clear Filters successfully", async () => {
        mockedGetAllSites.mockResolvedValue({
            ok: true,
            json: async () => ({
                sites: [
                    { ...mockSite, collectionDate: "2022-01-15", latitude: 1, longitude: 1 },
                    { ...mockSite, collectionDate: "2023-06-15", latitude: 2, longitude: 2 },
                    { ...mockSite, collectionDate: "2024-12-15", latitude: 3, longitude: 3 },
                ],
            }),
        } as any);

        render(<HomePage />);

        const dateInputs = document.querySelectorAll('input[type="date"]');
        expect(dateInputs.length).toBe(2);

        //set start and end date
        await userEvent.type(dateInputs[0] as HTMLElement, "2022-01-01");
        await userEvent.type(dateInputs[1] as HTMLElement, "2024-01-01");

        //clear filters
        expect(screen.getByRole("button", { name: "Clear All" })).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Clear All" }));
    });

});
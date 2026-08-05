/**
 * Berekent gereden kilometers voor geplande klussen:
 * één klus: kantoor → klus → kantoor;
 * meerdere klussen op één dag: kantoor → klus1 → klus2 → … → kantoor.
 */

const DEFAULT_OFFICE =
    "Monitorweg 10, 1322 BJ Almere, Nederland";

const NOMINATIM_UA =
    "MDB-PMS/1.0 (contact: pms.mdb-networks.nl)";

type Coords = { lat: number; lon: number };

const geocodeCache = new Map<string, Coords | null>();

let lastNominatimAt = 0;

async function waitNominatimSlot() {
    const elapsed = Date.now() - lastNominatimAt;
    if (elapsed < 1100) {
        await new Promise((r) =>
            setTimeout(r, 1100 - elapsed)
        );
    }
    lastNominatimAt = Date.now();
}

export function getOfficeAddress(): string {
    const fromEnv =
        process.env.MDB_OFFICE_ADDRESS?.trim();
    return fromEnv || DEFAULT_OFFICE;
}

export function jobAddressFromWorkorder(workorder: {
    location: string | null;
    city: string | null;
    customer?: { address: string | null } | null;
}): string | null {
    const street = workorder.location?.trim();
    const city = workorder.city?.trim();

    if (street && city) {
        return `${street}, ${city}, Nederland`;
    }
    if (street) {
        return `${street}, Nederland`;
    }
    if (city) {
        return `${city}, Nederland`;
    }

    const customerAddr =
        workorder.customer?.address?.trim();
    if (!customerAddr) {
        return null;
    }
    if (/nederland/i.test(customerAddr)) {
        return customerAddr;
    }
    return `${customerAddr}, Nederland`;
}

export function projectJobAddress(project: {
    location: string | null;
    customer?: { address: string | null } | null;
}): string | null {
    const loc = project.location?.trim();
    if (loc) {
        if (/nederland/i.test(loc)) {
            return loc;
        }
        return `${loc}, Nederland`;
    }

    const customerAddr =
        project.customer?.address?.trim();
    if (!customerAddr) {
        return null;
    }
    if (/nederland/i.test(customerAddr)) {
        return customerAddr;
    }
    return `${customerAddr}, Nederland`;
}

async function geocodeAddress(
    query: string
): Promise<Coords | null> {
    const key = query.trim().toLowerCase();
    if (geocodeCache.has(key)) {
        return geocodeCache.get(key) ?? null;
    }

    await waitNominatimSlot();

    const url = new URL(
        "https://nominatim.openstreetmap.org/search"
    );
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "nl");

    try {
        const res = await fetch(url.toString(), {
            headers: {
                "User-Agent": NOMINATIM_UA,
                Accept: "application/json",
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
            geocodeCache.set(key, null);
            return null;
        }

        const data = (await res.json()) as {
            lat: string;
            lon: string;
        }[];

        if (!data?.length) {
            geocodeCache.set(key, null);
            return null;
        }

        const coords = {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
        };

        if (
            Number.isNaN(coords.lat) ||
            Number.isNaN(coords.lon)
        ) {
            geocodeCache.set(key, null);
            return null;
        }

        geocodeCache.set(key, coords);
        return coords;
    } catch {
        geocodeCache.set(key, null);
        return null;
    }
}

async function drivingKmOneWay(
    from: Coords,
    to: Coords
): Promise<number | null> {
    return drivingRouteKm([from, to]);
}

async function drivingRouteKm(
    waypoints: Coords[]
): Promise<number | null> {
    const result =
        await drivingRouteResult(waypoints);
    return result?.kilometers ?? null;
}

export type OfficeRouteResult = {
    kilometers: number;
    reisuren: number;
};

async function drivingRouteResult(
    waypoints: Coords[]
): Promise<OfficeRouteResult | null> {
    if(waypoints.length < 2){
        return null;
    }

    const path = waypoints
        .map((c)=>`${c.lon},${c.lat}`)
        .join(";");

    const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=false`;

    try {
        const res = await fetch(url, {
            signal: AbortSignal.timeout(20000),
        });

        if(!res.ok){
            return null;
        }

        const data = (await res.json()) as {
            code?: string;
            routes?: {
                distance: number;
                duration: number;
            }[];
        };

        if(
            data.code !== "Ok" ||
            !data.routes?.[0]?.distance
        ){
            return null;
        }

        const route = data.routes[0];
        const km = route.distance / 1000;
        const reisuren = route.duration / 3600;

        if(km <= 0 || reisuren <= 0){
            return null;
        }

        return {
            kilometers:
                Math.round(km),
            reisuren:
                Math.round((route.duration / 3600) * 4) / 4,
        };
    } catch {
        return null;
    }
}

/** Kantoor → klussen (volgorde) → kantoor. */
export async function officeRouteFromJobs(
    jobAddressesOrdered: string[]
): Promise<OfficeRouteResult | null> {
    const jobs = dedupeJobAddressesOrdered(
        jobAddressesOrdered
    );

    if(jobs.length === 0){
        return null;
    }

    if(jobs.length === 1){
        const office = getOfficeAddress();
        const officeCoords = await geocodeAddress(office);
        const jobCoords = await geocodeAddress(jobs[0]);
        if(!officeCoords || !jobCoords){
            return null;
        }
        const waypoints = [
            officeCoords,
            jobCoords,
            officeCoords,
        ];
        return drivingRouteResult(waypoints);
    }

    const office = getOfficeAddress();
    const officeCoords = await geocodeAddress(office);
    if(!officeCoords){
        return null;
    }

    const jobCoords: Coords[] = [];
    for(const job of jobs){
        const coords = await geocodeAddress(job);
        if(!coords){
            return null;
        }
        jobCoords.push(coords);
    }

    const waypoints = [
        officeCoords,
        ...jobCoords,
        officeCoords,
    ];

    return drivingRouteResult(waypoints);
}

/** Zelfde adres na elkaar samenvoegen (volgorde blijft). */
export function dedupeJobAddressesOrdered(
    addresses: string[]
): string[] {
    const out: string[] = [];
    let prev = "";

    for(const addr of addresses){
        const key = addr.trim().toLowerCase();
        if(!key){
            continue;
        }
        if(key === prev){
            continue;
        }
        out.push(addr);
        prev = key;
    }

    return out;
}

export function startOfCalendarDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function endOfCalendarDay(date: Date): Date {
    const d = startOfCalendarDay(date);
    d.setDate(d.getDate() + 1);
    return d;
}

export function engineerDayKey(
    engineerId: string,
    plannedDate: Date
): string {
    const d = startOfCalendarDay(plannedDate);
    return `${engineerId}:${d.toISOString().slice(0, 10)}`;
}

/** Rijroute langs meerdere klussen, start en eind op kantoor. */
export async function dayRouteKmFromOffice(
    jobAddressesOrdered: string[]
): Promise<number | null> {
    const jobs = dedupeJobAddressesOrdered(
        jobAddressesOrdered
    );

    if(jobs.length === 0){
        return null;
    }

    if(jobs.length === 1){
        return roundTripKmFromOffice(jobs[0]);
    }

    const office = getOfficeAddress();
    const officeCoords = await geocodeAddress(office);
    if(!officeCoords){
        return null;
    }

    const jobCoords: Coords[] = [];

    for(const job of jobs){
        const coords = await geocodeAddress(job);
        if(!coords){
            return null;
        }
        jobCoords.push(coords);
    }

    const waypoints = [
        officeCoords,
        ...jobCoords,
        officeCoords,
    ];

    const km = await drivingRouteKm(waypoints);

    if(km == null || km <= 0){
        return null;
    }

    return Math.round(km);
}

/** Heen en terug kantoor ↔ klus (hele kilometers). */
export async function roundTripKmFromOffice(
    jobAddress: string
): Promise<number | null> {
    const route =
        await officeRouteFromJobs([jobAddress]);

    return route?.kilometers ?? null;
}

export async function computePlannedRoundTripKm(
    workorder: {
        location: string | null;
        city: string | null;
        plannedDate: Date | null;
        customer?: { address: string | null } | null;
    }
): Promise<number | null> {
    if (!workorder.plannedDate) {
        return null;
    }

    const job = jobAddressFromWorkorder(workorder);
    if (!job) {
        return null;
    }

    return roundTripKmFromOffice(job);
}

/** Kilometers + reistijd voor één monteur op één dag. */
export async function plannedTravelForEngineerDay(
    items: {
        formKilometers: number;
        formReisuren?: number;
        jobAddress: string | null;
        plannedDate: Date;
    }[]
): Promise<{ kilometers: number; reisuren: number }> {

    let manualKm = 0;
    let manualReis = 0;

    const autoJobs: {
        address: string;
        plannedDate: Date;
    }[] = [];

    for(const item of items){

        if(item.formKilometers > 0){
            manualKm += item.formKilometers;
            if((item.formReisuren ?? 0) > 0){
                manualReis += item.formReisuren!;
            }
            continue;
        }

        if((item.formReisuren ?? 0) > 0){
            manualReis += item.formReisuren!;
        }

        if(item.jobAddress){
            autoJobs.push({
                address:item.jobAddress,
                plannedDate:item.plannedDate
            });
        }

    }

    if(autoJobs.length === 0){
        return {
            kilometers:manualKm,
            reisuren:manualReis
        };
    }

    autoJobs.sort(
        (a,b)=>
            a.plannedDate.getTime()
            - b.plannedDate.getTime()
    );

    const addresses =
        autoJobs.map((j)=>j.address);

    const route =
        await officeRouteFromJobs(addresses);

    return {
        kilometers:
            manualKm + (route?.kilometers ?? 0),
        reisuren:
            manualReis + (route?.reisuren ?? 0)
    };
}

export async function plannedKilometersForEngineerDay(
    items: {
        formKilometers: number;
        jobAddress: string | null;
        plannedDate: Date;
    }[]
): Promise<number> {
    const result =
        await plannedTravelForEngineerDay(items);
    return result.kilometers;
}

/** Kilometers voor rapportage: handmatig op werkbon, anders berekend bij planning. */
export function reportKilometersForWorkorder(
    formKilometers: number,
    plannedRoundTripKm: number | null,
    voorrijtarief: boolean | null = null
): number {
    if (voorrijtarief === true) {
        return 0;
    }
    if (formKilometers > 0) {
        return formKilometers;
    }
    return plannedRoundTripKm ?? 0;
}

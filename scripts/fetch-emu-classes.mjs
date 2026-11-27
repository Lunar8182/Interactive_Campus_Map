import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const BANNER_BASE_URL =
  "https://bannerweb.oci.emich.edu/StudentRegistrationSsb/ssb";

function parseArgs(argv) {
  const args = {
    terms: null,
    out: path.join(REPO_ROOT, "my-react-app", "frontend_map", "public", "data"),
    buildings: path.join(REPO_ROOT, "scripts", "emu-buildings.json"),
    delay: 350,
    strict: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--terms" && argv[i + 1]) {
      args.terms = argv[++i]
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (arg === "--out" && argv[i + 1]) {
      args.out = path.resolve(argv[++i]);
    } else if (arg === "--buildings" && argv[i + 1]) {
      args.buildings = path.resolve(argv[++i]);
    } else if (arg === "--delay" && argv[i + 1]) {
      args.delay = Number(argv[++i]) || 350;
    } else if (arg === "--strict") {
      args.strict = true;
    }
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtmlEntities(str) {
  if (typeof str !== "string") return str ?? "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

function format12HourTime(hhmm) {
  if (!hhmm || typeof hhmm !== "string" || hhmm.length < 3) return null;
  const padded = hhmm.padStart(4, "0");
  const hour24 = Number(padded.slice(0, 2));
  const minute = padded.slice(2, 4);
  if (Number.isNaN(hour24)) return null;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${suffix}`;
}

function formatDays(mt) {
  if (!mt) return "";
  let days = "";
  if (mt.monday) days += "M";
  if (mt.tuesday) days += "T";
  if (mt.wednesday) days += "W";
  if (mt.thursday) days += "R";
  if (mt.friday) days += "F";
  if (mt.saturday) days += "S";
  if (mt.sunday) days += "U";
  return days;
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  capture(res) {
    const rawCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : res.headers.get("set-cookie")
        ? res.headers.get("set-cookie").split(/,(?=[^;]+?=)/)
        : [];

    for (const raw of rawCookies) {
      const firstPart = raw.split(";")[0]?.trim();
      if (!firstPart) continue;
      const eqIdx = firstPart.indexOf("=");
      if (eqIdx === -1) continue;
      const name = firstPart.slice(0, eqIdx).trim();
      const val = firstPart.slice(eqIdx + 1).trim();
      this.cookies.set(name, val);
    }
  }

  header() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
}

async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status} from ${url}`);
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < attempts) {
        await sleep(500 * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastErr;
}

async function fetchAvailableTerms() {
  const res = await fetchWithRetry(
    `${BANNER_BASE_URL}/classSearch/getTerms?offset=1&max=20`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch terms: HTTP ${res.status}`);
  }
  return res.json();
}

async function fetchTermSections(termCode, delayMs) {
  const jar = new CookieJar();
  const baseHeaders = {
    "User-Agent": "EMU-CampusMap-CatalogSync/1.0",
  };

  const termRes = await fetchWithRetry(
    `${BANNER_BASE_URL}/term/search?mode=search`,
    {
      method: "POST",
      headers: {
        ...baseHeaders,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: `term=${encodeURIComponent(termCode)}`,
    }
  );
  jar.capture(termRes);
  if (!termRes.ok) {
    throw new Error(`Term init failed for ${termCode}: HTTP ${termRes.status}`);
  }

  const pageMaxSize = 500;
  let pageOffset = 0;
  let totalCount = null;
  const allRows = [];

  while (true) {
    const url = `${BANNER_BASE_URL}/searchResults/searchResults?txt_term=${encodeURIComponent(
      termCode
    )}&pageOffset=${pageOffset}&pageMaxSize=${pageMaxSize}`;

    const res = await fetchWithRetry(url, {
      headers: {
        ...baseHeaders,
        Cookie: jar.header(),
      },
    });
    jar.capture(res);
    if (!res.ok) {
      throw new Error(
        `Search failed for ${termCode} offset ${pageOffset}: HTTP ${res.status}`
      );
    }

    const json = await res.json();
    if (totalCount === null) {
      totalCount = Number(json.totalCount ?? 0);
    }

    const rows = Array.isArray(json.data) ? json.data : [];
    allRows.push(...rows);

    if (rows.length === 0 || allRows.length >= totalCount) {
      break;
    }

    pageOffset += pageMaxSize;
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return { totalCount: totalCount ?? allRows.length, rows: allRows };
}

function normalizeSection(raw, buildingsMap, unmappedTracker) {
  const crn = String(raw.courseReferenceNumber || "").trim();
  const subject = String(raw.subject || "").trim();
  const courseNumber = String(raw.courseNumber || "").trim();
  const section = String(raw.sequenceNumber || "").trim();
  const title = decodeHtmlEntities(raw.courseTitle || "").trim();
  const campus = decodeHtmlEntities(raw.campusDescription || "").trim();
  const scheduleType = decodeHtmlEntities(
    raw.scheduleTypeDescription || ""
  ).trim();
  const primaryFaculty =
    Array.isArray(raw.faculty) && raw.faculty.length > 0
      ? decodeHtmlEntities(raw.faculty[0].displayName || "").trim()
      : "";

  const campusIndicatesOnline = /online/i.test(campus);
  const rawMeetings = Array.isArray(raw.meetingsFaculty)
    ? raw.meetingsFaculty
    : [];

  const meetings = [];

  for (const mf of rawMeetings) {
    const mt = mf?.meetingTime;
    if (!mt) continue;

    const buildingCode = mt.building ? String(mt.building).trim() : null;
    const buildingName = mt.buildingDescription
      ? decodeHtmlEntities(String(mt.buildingDescription).trim())
      : null;
    const room = mt.room ? String(mt.room).trim() : null;
    const days = formatDays(mt);
    const startTime = format12HourTime(mt.beginTime);
    const endTime = format12HourTime(mt.endTime);

    const mapped = buildingCode ? buildingsMap[buildingCode] : null;

    let locationType;
    if (
      buildingCode === "ONLINE" ||
      mapped?.locationType === "online" ||
      (!buildingCode && campusIndicatesOnline)
    ) {
      locationType = "online";
    } else if (!buildingCode || mapped?.locationType === "tba") {
      locationType = "tba";
    } else if (mapped) {
      locationType = mapped.locationType || "campus";
    } else {
      locationType = "unmapped";
      const key = buildingCode;
      if (!unmappedTracker.has(key)) {
        unmappedTracker.set(key, {
          code: buildingCode,
          description: buildingName || "",
          count: 0,
          sampleCampus: campus,
        });
      }
      unmappedTracker.get(key).count += 1;
    }

    const isOnline = locationType === "online";
    const isTba = locationType === "tba";

    let timeDisplay;
    if (startTime && endTime) {
      const range = `${startTime} - ${endTime}`;
      const base = days ? `${days} ${range}` : range;
      timeDisplay = isOnline ? `${base} (Online)` : base;
    } else if (isOnline) {
      timeDisplay = "Online (Asynchronous)";
    } else {
      timeDisplay = "TBA";
    }

    meetings.push({
      days,
      startTime,
      endTime,
      timeDisplay,
      buildingCode,
      buildingName,
      canonicalBuilding: mapped
        ? mapped.canonicalName
        : isOnline
        ? "Online"
        : isTba
        ? "TBA"
        : buildingName || buildingCode,
      room,
      locationType,
      isOnline,
      isTba,
      lng: typeof mapped?.lng === "number" ? mapped.lng : null,
      lat: typeof mapped?.lat === "number" ? mapped.lat : null,
    });
  }

  if (meetings.length === 0) {
    const isOnline = campusIndicatesOnline;
    meetings.push({
      days: "",
      startTime: null,
      endTime: null,
      timeDisplay: isOnline ? "Online (Asynchronous)" : "TBA",
      buildingCode: isOnline ? "ONLINE" : null,
      buildingName: isOnline ? "Online" : null,
      canonicalBuilding: isOnline ? "Online" : "TBA",
      room: null,
      locationType: isOnline ? "online" : "tba",
      isOnline,
      isTba: !isOnline,
      lng: null,
      lat: null,
    });
  }

  let locationType = "tba";
  if (meetings.some((m) => m.locationType === "campus")) {
    locationType = "campus";
  } else if (meetings.some((m) => m.locationType === "off-campus")) {
    locationType = "off-campus";
  } else if (meetings.some((m) => m.locationType === "unmapped")) {
    locationType = "unmapped";
  } else if (meetings.some((m) => m.locationType === "online")) {
    locationType = "online";
  }

  return {
    crn,
    classId: `${subject} ${courseNumber}`.trim(),
    subject,
    courseNumber,
    section,
    title,
    campus,
    scheduleType,
    instructor: primaryFaculty,
    locationType,
    isOnline: locationType === "online",
    isTba: locationType === "tba",
    meetings,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const buildingsRaw = await fs.readFile(args.buildings, "utf8");
  const buildingsMap = JSON.parse(buildingsRaw);

  const availableTerms = await fetchAvailableTerms();
  let targetTerms;
  if (args.terms && args.terms.length > 0) {
    targetTerms = args.terms.map((code) => {
      const match = availableTerms.find((t) => t.code === code);
      return {
        code,
        description: match ? decodeHtmlEntities(match.description) : code,
      };
    });
  } else {
    targetTerms = availableTerms
      .filter((t) => /^2027(10|20|50)$/.test(t.code))
      .map((t) => ({
        code: t.code,
        description: decodeHtmlEntities(t.description),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  if (targetTerms.length === 0) {
    throw new Error("No matching terms found.");
  }

  await fs.mkdir(args.out, { recursive: true });

  const unmappedTracker = new Map();
  const indexTerms = [];
  const generatedAt = new Date().toISOString();

  for (const termObj of targetTerms) {
    console.log(`Fetching term ${termObj.code} (${termObj.description})...`);
    const { totalCount, rows } = await fetchTermSections(
      termObj.code,
      args.delay
    );

    const byCrn = new Map();
    for (const raw of rows) {
      const normalized = normalizeSection(raw, buildingsMap, unmappedTracker);
      if (normalized.crn && !byCrn.has(normalized.crn)) {
        byCrn.set(normalized.crn, normalized);
      }
    }

    const sections = Array.from(byCrn.values()).sort((a, b) => {
      return (
        a.subject.localeCompare(b.subject) ||
        a.courseNumber.localeCompare(b.courseNumber) ||
        a.section.localeCompare(b.section) ||
        a.crn.localeCompare(b.crn)
      );
    });

    const counts = {
      campus: 0,
      online: 0,
      tba: 0,
      "off-campus": 0,
      unmapped: 0,
    };
    for (const sec of sections) {
      counts[sec.locationType] = (counts[sec.locationType] || 0) + 1;
    }

    const fileName = `classes-${termObj.code}.json`;
    const filePath = path.join(args.out, fileName);
    await fs.writeFile(
      filePath,
      JSON.stringify({
        term: termObj.code,
        termDesc: termObj.description,
        generatedAt,
        totalSections: sections.length,
        apiTotalCount: totalCount,
        counts,
        sections,
      })
    );

    console.log(
      `  -> Saved ${sections.length}/${totalCount} sections to ${fileName} (campus=${counts.campus}, online=${counts.online}, tba=${counts.tba}, off-campus=${counts["off-campus"]}, unmapped=${counts.unmapped})`
    );

    indexTerms.push({
      term: termObj.code,
      termDesc: termObj.description,
      file: `data/${fileName}`,
      totalSections: sections.length,
      counts,
    });
  }

  const indexPath = path.join(args.out, "catalog-index.json");
  await fs.writeFile(
    indexPath,
    JSON.stringify(
      {
        academicYear: "2026-2027",
        generatedAt,
        terms: indexTerms,
      },
      null,
      2
    )
  );

  if (unmappedTracker.size > 0) {
    console.log("\nUnmapped building codes found:");
    for (const item of Array.from(unmappedTracker.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    )) {
      console.log(
        `  - ${item.code} | ${item.description} | count=${item.count} | sampleCampus=${item.sampleCampus}`
      );
    }
    if (args.strict) {
      process.exitCode = 1;
    }
  } else {
    console.log("\nAll building codes mapped (0 unmapped).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

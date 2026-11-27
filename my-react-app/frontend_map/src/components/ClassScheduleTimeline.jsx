import React, { useMemo, useState } from "react";
import { Calendar, Clock, List, MapPin, Trash2, X } from "lucide-react";

export const DAYS = [
  { code: "M", short: "Mon" },
  { code: "T", short: "Tue" },
  { code: "W", short: "Wed" },
  { code: "R", short: "Thu" },
  { code: "F", short: "Fri" },
  { code: "S", short: "Sat" },
  { code: "U", short: "Sun" },
];

const HOUR_HEIGHT = 44;

const CAMPUS_THEMES = [
  {
    bg: "bg-emerald-50",
    border: "border-emerald-500",
    text: "text-emerald-950",
    sub: "text-emerald-700",
  },
  {
    bg: "bg-teal-50",
    border: "border-teal-500",
    text: "text-teal-950",
    sub: "text-teal-700",
  },
  {
    bg: "bg-indigo-50",
    border: "border-indigo-500",
    text: "text-indigo-950",
    sub: "text-indigo-700",
  },
  {
    bg: "bg-violet-50",
    border: "border-violet-500",
    text: "text-violet-950",
    sub: "text-violet-700",
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-500",
    text: "text-amber-950",
    sub: "text-amber-700",
  },
  {
    bg: "bg-rose-50",
    border: "border-rose-500",
    text: "text-rose-950",
    sub: "text-rose-700",
  },
];

const ONLINE_THEME = {
  bg: "bg-sky-50",
  border: "border-sky-500",
  text: "text-sky-950",
  sub: "text-sky-700",
};

export function parseTimeToMinutes(str) {
  if (!str || typeof str !== "string") return null;
  const match = str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3] ? match[3].toUpperCase() : null;
  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (meridiem === "PM" ? 12 : 0);
  } else if (hours < 0 || hours > 23) {
    return null;
  }
  return hours * 60 + minutes;
}

export function parseLegacyTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const cleaned = timeStr
    .replace(/\((Online|Asynchronous|TBA)\)/gi, "")
    .trim();

  const timeMatches = cleaned.match(/\d{1,2}:\d{2}\s*(?:AM|PM)?/gi) || [];
  if (timeMatches.length === 0) return null;

  const startMin = parseTimeToMinutes(timeMatches[0]);
  if (startMin === null) return null;

  let endMin =
    timeMatches.length >= 2 ? parseTimeToMinutes(timeMatches[1]) : startMin + 60;
  if (endMin === null || endMin <= startMin) {
    endMin = Math.min(1440, startMin + 60);
  }

  const firstTimeIdx = cleaned.search(/\d{1,2}:\d{2}/);
  const dayPrefix = (firstTimeIdx > 0 ? cleaned.slice(0, firstTimeIdx) : "")
    .replace(/\bMon(day)?\b/gi, "M")
    .replace(/\bTue(sday)?\b|\bTu\b/gi, "T")
    .replace(/\bWed(nesday)?\b/gi, "W")
    .replace(/\bThu(rsday)?\b|\bTh\b/gi, "R")
    .replace(/\bFri(day)?\b/gi, "F")
    .replace(/\bSat(urday)?\b/gi, "S")
    .replace(/\bSun(day)?\b/gi, "U")
    .toUpperCase();

  const validCodes = new Set(DAYS.map((d) => d.code));
  const days = Array.from(
    new Set(dayPrefix.split("").filter((ch) => validCodes.has(ch)))
  ).join("");

  if (!days) return null;
  return { days, startMin, endMin };
}

export function computeDayLayout(blocks) {
  if (!blocks || blocks.length === 0) return [];
  const sorted = [...blocks].sort(
    (a, b) => a.startMin - b.startMin || b.endMin - a.endMin
  );

  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -1;

  for (const blk of sorted) {
    if (currentCluster.length === 0 || blk.startMin < clusterEnd) {
      currentCluster.push(blk);
      clusterEnd = Math.max(clusterEnd, blk.endMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [blk];
      clusterEnd = blk.endMin;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const positioned = [];
  for (const cluster of clusters) {
    const colEnds = [];
    const assigned = [];
    for (const blk of cluster) {
      let colIndex = colEnds.findIndex((end) => end <= blk.startMin);
      if (colIndex === -1) {
        colIndex = colEnds.length;
        colEnds.push(blk.endMin);
      } else {
        colEnds[colIndex] = blk.endMin;
      }
      assigned.push({ ...blk, colIndex });
    }
    const colCount = Math.max(1, colEnds.length);
    for (const item of assigned) {
      positioned.push({ ...item, colCount });
    }
  }

  return positioned;
}

export function buildTimelineSchedule(savedClasses = []) {
  const blocksByDay = Object.fromEntries(DAYS.map((d) => [d.code, []]));
  const unscheduled = [];
  let earliestMin = Infinity;
  let latestMin = -Infinity;

  savedClasses.forEach((cls, idx) => {
    const isOnlineCls = cls.isOnline || cls.locationType === "online";
    const theme = isOnlineCls
      ? ONLINE_THEME
      : CAMPUS_THEMES[idx % CAMPUS_THEMES.length];

    let placedCount = 0;

    if (Array.isArray(cls.meetings) && cls.meetings.length > 0) {
      cls.meetings.forEach((mt, mIdx) => {
        const startMin = parseTimeToMinutes(mt.startTime);
        const endMin = parseTimeToMinutes(mt.endTime);
        if (!mt.days || startMin === null || endMin === null || endMin <= startMin) {
          return;
        }

        for (const dayChar of mt.days) {
          if (!blocksByDay[dayChar]) continue;
          blocksByDay[dayChar].push({
            key: `${cls.id}-${mIdx}-${dayChar}`,
            classId: cls.id,
            cls,
            course: cls.course,
            building: mt.canonicalBuilding || cls.building,
            room: mt.room || cls.room || null,
            isOnline: Boolean(mt.isOnline || isOnlineCls),
            startMin,
            endMin,
            theme,
          });
          placedCount += 1;
        }

        if (startMin < earliestMin) earliestMin = startMin;
        if (endMin > latestMin) latestMin = endMin;
      });
    } else {
      const parsed = parseLegacyTimeString(cls.time);
      if (parsed) {
        for (const dayChar of parsed.days) {
          if (!blocksByDay[dayChar]) continue;
          blocksByDay[dayChar].push({
            key: `${cls.id}-legacy-${dayChar}`,
            classId: cls.id,
            cls,
            course: cls.course,
            building: cls.building,
            room: cls.room || null,
            isOnline: Boolean(isOnlineCls),
            startMin: parsed.startMin,
            endMin: parsed.endMin,
            theme,
          });
          placedCount += 1;
        }
        if (parsed.startMin < earliestMin) earliestMin = parsed.startMin;
        if (parsed.endMin > latestMin) latestMin = parsed.endMin;
      }
    }

    if (placedCount === 0) {
      unscheduled.push(cls);
    }
  });

  const startHour =
    earliestMin === Infinity
      ? 7
      : Math.max(0, Math.min(7, Math.floor(earliestMin / 60)));
  const endHour =
    latestMin === -Infinity
      ? 22
      : Math.min(24, Math.max(22, Math.ceil(latestMin / 60)));

  for (const day of DAYS) {
    blocksByDay[day.code] = computeDayLayout(blocksByDay[day.code]);
  }

  return { blocksByDay, unscheduled, startHour, endHour };
}

function formatHourLabel(hour24) {
  if (hour24 === 0 || hour24 === 24) return "12 AM";
  if (hour24 === 12) return "12 PM";
  return hour24 > 12 ? `${hour24 - 12} PM` : `${hour24} AM`;
}

function getLocationBadge(cls) {
  if (cls.isOnline || cls.locationType === "online") {
    return (
      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
        Online
      </span>
    );
  }
  if (cls.isTba || cls.locationType === "tba") {
    return (
      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
        TBA
      </span>
    );
  }
  if (cls.locationType === "off-campus" && typeof cls.lng !== "number") {
    return (
      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">
        Off-Campus
      </span>
    );
  }
  return null;
}

export default function ClassScheduleTimeline({
  savedClasses,
  termLabel,
  onLocateClass,
  onRemoveClass,
}) {
  const [viewMode, setViewMode] = useState("timeline");
  const [selectedClassId, setSelectedClassId] = useState(null);

  const { blocksByDay, unscheduled, startHour, endHour } = useMemo(
    () => buildTimelineSchedule(savedClasses),
    [savedClasses]
  );

  const selectedClass = useMemo(
    () => savedClasses.find((c) => c.id === selectedClassId) || null,
    [savedClasses, selectedClassId]
  );

  const hours = useMemo(() => {
    const arr = [];
    for (let h = startHour; h < endHour; h += 1) {
      arr.push(h);
    }
    return arr;
  }, [startHour, endHour]);

  const now = new Date();
  const jsDayToCode = ["U", "M", "T", "W", "R", "F", "S"];
  const todayCode = jsDayToCode[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine =
    nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;
  const nowTopPx = ((nowMinutes - startHour * 60) / 60) * HOUR_HEIGHT;

  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600">
          <span className="font-semibold text-emu-dark">
            {termLabel ? `${termLabel} • ` : ""}
            {savedClasses.length} {savedClasses.length === 1 ? "class" : "classes"}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            Campus
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
            Online
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
            TBA
          </span>
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors ${
              viewMode === "timeline"
                ? "bg-white text-emu-dark shadow-sm"
                : "text-gray-600 hover:text-emu-dark"
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors ${
              viewMode === "list"
                ? "bg-white text-emu-dark shadow-sm"
                : "text-gray-600 hover:text-emu-dark"
            }`}
          >
            <List className="w-3 h-3" />
            <span>List</span>
          </button>
        </div>
      </div>

      {savedClasses.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50/70 p-6 text-center text-xs text-gray-500">
          No classes saved for <span className="font-bold text-emu-dark">{termLabel || "this semester"}</span> yet. Search above to add classes.
        </div>
      ) : viewMode === "timeline" ? (
        <>
          <div className="overflow-x-auto emu-scrollbar border border-gray-200 rounded-lg bg-white">
            <div className="min-w-[500px] max-h-[440px] overflow-y-auto emu-scrollbar">
              <div
                className="sticky top-0 z-10 grid bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-700"
                style={{ gridTemplateColumns: "44px repeat(7, minmax(0, 1fr))" }}
              >
                <div className="py-2 px-1 text-center text-[10px] text-gray-400 border-r border-gray-200">
                  Time
                </div>
                {DAYS.map((day) => (
                  <div
                    key={day.code}
                    className={`py-2 text-center border-r last:border-r-0 border-gray-200 ${
                      day.code === todayCode
                        ? "bg-emu-light/70 text-emu-dark"
                        : ""
                    }`}
                  >
                    {day.short}
                  </div>
                ))}
              </div>

              <div
                className="grid relative"
                style={{
                  gridTemplateColumns: "44px repeat(7, minmax(0, 1fr))",
                  height: `${totalHeight}px`,
                }}
              >
                <div className="relative border-r border-gray-200 bg-gray-50/50">
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="absolute right-1.5 text-[10px] font-semibold text-gray-400 -translate-y-1/2"
                      style={{ top: `${i === 0 ? 8 : i * HOUR_HEIGHT}px` }}
                    >
                      {formatHourLabel(h)}
                    </div>
                  ))}
                </div>

                {DAYS.map((day) => {
                  const dayBlocks = blocksByDay[day.code] || [];
                  const isToday = day.code === todayCode;
                  return (
                    <div
                      key={day.code}
                      className={`relative border-r last:border-r-0 border-gray-200 ${
                        isToday ? "bg-emu-light/20" : ""
                      }`}
                    >
                      {hours.map((h, i) => (
                        <React.Fragment key={h}>
                          <div
                            className="absolute left-0 right-0 border-t border-gray-100 pointer-events-none"
                            style={{ top: `${i * HOUR_HEIGHT}px` }}
                          />
                          <div
                            className="absolute left-0 right-0 border-t border-dashed border-gray-100/80 pointer-events-none"
                            style={{ top: `${i * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                          />
                        </React.Fragment>
                      ))}

                      {isToday && showNowLine && (
                        <div
                          className="absolute left-0 right-0 border-t-2 border-red-400 z-10 pointer-events-none"
                          style={{ top: `${nowTopPx}px` }}
                        />
                      )}

                      {dayBlocks.map((blk) => {
                        const topPx =
                          ((blk.startMin - startHour * 60) / 60) * HOUR_HEIGHT;
                        const heightPx = Math.max(
                          22,
                          ((blk.endMin - blk.startMin) / 60) * HOUR_HEIGHT
                        );
                        const widthPct = 100 / blk.colCount;
                        const leftPct = blk.colIndex * widthPct;
                        const isSelected = selectedClassId === blk.classId;

                        return (
                          <button
                            key={blk.key}
                            type="button"
                            onClick={() =>
                              setSelectedClassId((prev) =>
                                prev === blk.classId ? null : blk.classId
                              )
                            }
                            title={`${blk.course} • ${blk.building}${
                              blk.room ? ` ${blk.room}` : ""
                            }`}
                            className={`absolute z-10 text-left px-1 py-0.5 rounded border-l-4 overflow-hidden transition-shadow ${
                              blk.theme.bg
                            } ${blk.theme.border} ${blk.theme.text} ${
                              isSelected
                                ? "ring-2 ring-emu-green shadow-md z-20"
                                : "hover:shadow-sm"
                            }`}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: `calc(${leftPct}% + 2px)`,
                              width: `calc(${widthPct}% - 4px)`,
                            }}
                          >
                            <div className="text-[10px] font-extrabold leading-tight truncate">
                              {blk.course}
                            </div>
                            {heightPx >= 34 && (
                              <div
                                className={`text-[9px] leading-tight truncate ${blk.theme.sub}`}
                              >
                                {blk.isOnline
                                  ? "Online"
                                  : `${blk.building}${
                                      blk.room ? ` ${blk.room}` : ""
                                    }`}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedClass && (
            <div className="bg-emu-light/60 border border-green-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-extrabold text-emu-dark">
                    {selectedClass.course}
                  </span>
                  {selectedClass.crn && (
                    <span className="text-[10px] text-gray-500">
                      CRN {selectedClass.crn}
                    </span>
                  )}
                  {getLocationBadge(selectedClass)}
                </div>
                {selectedClass.title && (
                  <p className="font-semibold text-gray-800 truncate">
                    {selectedClass.title}
                  </p>
                )}
                <p className="text-gray-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emu-green shrink-0" />
                  <span>
                    {selectedClass.building}
                    {selectedClass.room ? ` ${selectedClass.room}` : ""} •{" "}
                    {selectedClass.time}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!selectedClass.isOnline &&
                  !selectedClass.isTba &&
                  !(
                    selectedClass.locationType === "off-campus" &&
                    typeof selectedClass.lng !== "number"
                  ) && (
                    <button
                      type="button"
                      onClick={() => onLocateClass(selectedClass)}
                      className="px-2.5 py-1 bg-emu-green hover:bg-emu-dark text-white rounded-md font-bold flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Locate on Map</span>
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => {
                    onRemoveClass(selectedClass.id);
                    setSelectedClassId(null);
                  }}
                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClassId(null)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                  title="Close details"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {unscheduled.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Online Async &amp; TBA Classes ({unscheduled.length})
              </p>
              {unscheduled.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-emu-dark">{cls.course}</span>
                    {cls.title && (
                      <span className="text-gray-700"> — {cls.title}</span>
                    )}
                    <span className="text-gray-500"> ({cls.time})</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    {getLocationBadge(cls)}
                    <button
                      type="button"
                      onClick={() => onRemoveClass(cls.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-1.5">
          {savedClasses.map((cls) => {
            const badge = getLocationBadge(cls);
            return (
              <div
                key={cls.id}
                className="flex items-center justify-between bg-emu-light/60 px-3 py-2 rounded-lg text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-emu-dark">{cls.course}</span>
                  {cls.title && (
                    <span className="text-gray-700"> — {cls.title}</span>
                  )}
                  <span className="text-gray-600">
                    {" "}
                    • {cls.building}
                    {cls.room ? ` ${cls.room}` : ""} ({cls.time})
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  {badge || (
                    <button
                      type="button"
                      onClick={() => onLocateClass(cls)}
                      className="text-emu-green font-bold hover:underline"
                    >
                      Map
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveClass(cls.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove class"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

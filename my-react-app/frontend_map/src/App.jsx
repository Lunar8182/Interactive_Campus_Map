// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  addDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  GraduationCap,
  Trophy,
  Flame,
  Settings,
  Plus,
  CalendarPlus,
  Users,
  Clock,
  MapPin,
  Bell,
  Check,
  X,
  Send,
  Utensils,
  BookOpen,
  Landmark,
  Compass,
  MessageSquare,
  UserCircle,
  LogOut,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  ShieldAlert,
  Navigation,
} from "lucide-react";
import "./App.css";

/* ============================================================================
   FIREBASE INITIALIZATION (Top-Level Scope)
   ============================================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyDifVjQsuO0OLrS-obAlFPIAq1iF5TDFaE",
  authDomain: "emumap-c36a9.firebaseapp.com",
  projectId: "emumap-c36a9",
  storageBucket: "emumap-c36a9.firebasestorage.app",
  messagingSenderId: "716868135148",
  appId: "1:716868135148:web:c007275d6b394e57401dc9",
  measurementId: "G-MZHSKE46XS",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "emu-campus-portal";

/* ============================================================================
   STATIC & SEED CAMPUS DATASETS (Ypsilanti, MI - Eastern Michigan University)
   ============================================================================ */
const CAMPUS_VIEWS = {
  "Eastern Michigan University": { center: [-83.6245, 42.2505], zoom: 15 },
  "Main Campus": { center: [-83.624, 42.2485], zoom: 16.5 },
  "West Campus": { center: [-83.6462, 42.2552], zoom: 16 },
};

const SEED_EVENTS = [
  {
    seedId: "seed_event_1",
    title: "EMU Game Day Tailgate",
    time: "2026-11-14T12:00",
    location: "Rynearson Stadium",
    lng: -83.6473,
    lat: 42.2562,
    badge: "Sports",
    attendingCount: 142,
    image:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80",
    desc: "Come support the Eagles at The Factory! Free food, live DJ music, and lawn games before kickoff.",
  },
  {
    seedId: "seed_event_2",
    title: "Student Center Pizza Night",
    time: "2026-11-18T18:00",
    location: "EMU Student Center",
    lng: -83.6242,
    lat: 42.2472,
    badge: "Free Food",
    attendingCount: 89,
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    desc: "Meet fellow Eagles and enjoy free pizza hosted by EMU Student Government on the 1st floor patio.",
  },
  {
    seedId: "seed_event_3",
    title: "Halle Library Late-Night Study Jam",
    time: "2026-11-20T20:00",
    location: "Bruce T. Halle Library",
    lng: -83.6248,
    lat: 42.2489,
    badge: "Academic",
    attendingCount: 64,
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
    desc: "Complimentary coffee, study snacks, and drop-in peer tutoring ahead of finals week.",
  },
];

const SEED_REQUESTS = [
  {
    seedId: "seed_req_1",
    title: "Eagles Esports Rocket League Open",
    time: "2026-11-21T17:30",
    location: "Sill Hall Esports Arena",
    lng: -83.6215,
    lat: 42.2482,
    badge: "Social",
    submittedBy: "Alex M. (Computer Science)",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    desc: "3v3 campus Rocket League tournament open to all EMU students with prizes for top teams.",
  },
  {
    seedId: "seed_req_2",
    title: "Sunset Yoga at University Park",
    time: "2026-11-22T16:30",
    location: "University Park Amphitheater",
    lng: -83.6235,
    lat: 42.2481,
    badge: "Social",
    submittedBy: "Maya R. (Rec/IM Wellness)",
    image:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80",
    desc: "Unwind by the campus lake with a beginner-friendly guided yoga session. Mats provided!",
  },
  {
    seedId: "seed_req_3",
    title: "Ypsi Student Startup Pitch Night",
    time: "2026-11-24T18:30",
    location: "Owen College of Business",
    lng: -83.6195,
    lat: 42.2428,
    badge: "Academic",
    submittedBy: "Jordan T. (College of Business)",
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80",
    desc: "Pitch your business idea in 3 minutes to local Ypsilanti founders and EMU faculty mentors.",
  },
];

const EMU_FOOD_LOCATIONS = [
  {
    id: "food-1",
    name: "The Commons",
    address: "900 Oakwood St, Ypsilanti, MI",
    hours: "7:00 AM – 9:00 PM",
    payment: "Meal Swipes • Dining Dollars • Card",
    highlights:
      "All-you-care-to-eat dining hall with rotating global stations, brick-oven pizza, and allergen-friendly kitchen.",
    tag: "Dining Hall",
    lng: -83.6258,
    lat: 42.2508,
  },
  {
    id: "food-2",
    name: "Student Center Food Court",
    address: "900 Oakwood St (1st Floor)",
    hours: "7:30 AM – 10:00 PM",
    payment: "Dining Dollars • Flex • Card",
    highlights:
      "Features Starbucks, Panda Express, Wendy’s, Smashburger, and Boar’s Head Deli.",
    tag: "Food Court",
    lng: -83.6242,
    lat: 42.2472,
  },
  {
    id: "food-3",
    name: "Halle Library Cafe",
    address: "955 W Circle Dr (1st Floor)",
    hours: "8:00 AM – 11:00 PM",
    payment: "Dining Dollars • Card",
    highlights:
      "Freshly brewed coffee, espresso drinks, warm pastries, and grab-and-go wraps for study sessions.",
    tag: "Cafe",
    lng: -83.6248,
    lat: 42.2489,
  },
  {
    id: "food-4",
    name: "Crossroads Marketplace",
    address: "850 W Cross St",
    hours: "9:00 AM – 12:00 AM",
    payment: "Meal Exchange • Dining Dollars • Card",
    highlights:
      "Late-night campus market with hot grill specials, smoothies, snacks, and grocery essentials.",
    tag: "Marketplace",
    lng: -83.6272,
    lat: 42.2515,
  },
  {
    id: "food-5",
    name: "Eastern Eateries",
    address: "850 W Circle Dr",
    hours: "11:00 AM – 11:00 PM",
    payment: "Meal Exchange • Dining Dollars",
    highlights:
      "Popular residence hall eatery serving custom subs, flatbreads, wings, and baked treats.",
    tag: "Eatery",
    lng: -83.6263,
    lat: 42.2498,
  },
];

const EMU_ACADEMIC_BUILDINGS = [
  {
    id: "class-1",
    name: "Pray-Harrold",
    code: "PH",
    departments:
      "College of Arts & Sciences • Communication • History • Economics • English",
    rooms: "Floors 1–7 (Rooms 101–714)",
    desc: "EMU’s largest classroom building located right on the central campus quad.",
    lng: -83.6231,
    lat: 42.2496,
  },
  {
    id: "class-2",
    name: "Sill Hall",
    code: "SILL",
    departments:
      "GameAbove College of Engineering & Technology • Computer Science • Cybersecurity",
    rooms: "Labs 102–245 • Esports Arena",
    desc: "Recently modernized engineering and technology hub with robotics and simulation labs.",
    lng: -83.6215,
    lat: 42.2482,
  },
  {
    id: "class-3",
    name: "Strong Hall",
    code: "STRG",
    departments: "Physics & Astronomy • Geography & Geology • EMU Planetarium",
    rooms: "Rooms 100–430 • Rooftop Observatory",
    desc: "Home to physical sciences, GIS labs, and the iconic spherical EMU Planetarium.",
    lng: -83.6238,
    lat: 42.2504,
  },
  {
    id: "class-4",
    name: "Mark Jefferson Science Complex",
    code: "MJ",
    departments: "Biology • Chemistry • Psychology • Environmental Science",
    rooms: "Atrium Lecture Halls • Research Wings A–D",
    desc: "State-of-the-art science research complex featuring a five-story glass atrium and greenhouse.",
    lng: -83.6249,
    lat: 42.2502,
  },
  {
    id: "class-5",
    name: "Owen Building (College of Business)",
    code: "OWEN",
    departments: "Accounting • Finance • Management • Marketing • Supply Chain",
    rooms: "Floors 1–4 • Ethos Trading Lab",
    desc: "Located near downtown Ypsilanti, connecting business students directly with regional industry.",
    lng: -83.6195,
    lat: 42.2428,
  },
];

const EMU_ATTRACTIONS = [
  {
    id: "attr-1",
    name: 'Rynearson Stadium ("The Factory")',
    category: "Athletics",
    established: "1969 • Capacity 30,200",
    desc: "Home of EMU Eagles Football, renowned nationwide for its signature gray FieldTurf.",
    lng: -83.6473,
    lat: 42.2562,
  },
  {
    id: "attr-2",
    name: "George Gervin GameAbove Center",
    category: "Arena & Events",
    established: "1998 • Capacity 8,824",
    desc: "Premier multi-purpose arena hosting Eagles Men’s & Women’s Basketball, concerts, and commencement.",
    lng: -83.6455,
    lat: 42.2542,
  },
  {
    id: "attr-3",
    name: "Pease Auditorium",
    category: "Historic Landmark",
    established: "1914 • Neoclassical Architecture",
    desc: "Historic concert hall hosting School of Music symphonies, guest lectures, and cultural showcases.",
    lng: -83.6212,
    lat: 42.2468,
  },
  {
    id: "attr-4",
    name: "McKenny Hall",
    category: "Historic Union",
    established: "1931 • Collegiate Gothic",
    desc: "Historic landmark on Cross Street that opened as the first student union at a teachers college in the US.",
    lng: -83.6206,
    lat: 42.2477,
  },
  {
    id: "attr-5",
    name: "University Park & Lake House",
    category: "Campus Nature",
    established: "Central Campus Oasis",
    desc: "Scenic campus pond, fountain, walking trails, and outdoor amphitheater beside the Student Center.",
    lng: -83.6235,
    lat: 42.2481,
  },
];

const EMU_POIS = [
  {
    id: "poi-1",
    name: "Rec/IM Center",
    type: "Recreation & Fitness",
    hours: "Mon–Fri 6:00 AM – 11:00 PM",
    contact: "(734) 487-1338",
    desc: "Indoor running track, weight rooms, lap pool, basketball/racquetball courts, and intramural sports.",
    lng: -83.6285,
    lat: 42.2512,
  },
  {
    id: "poi-2",
    name: "Snow Health Center",
    type: "Health & Counseling",
    hours: "Mon–Fri 8:00 AM – 5:00 PM",
    contact: "(734) 487-1122",
    desc: "University Health Services, on-site pharmacy, immunization clinic, and Counseling & Psychological Services (CAPS).",
    lng: -83.6268,
    lat: 42.2488,
  },
  {
    id: "poi-3",
    name: "DPS Public Safety (EMU Police)",
    type: "Campus Safety",
    hours: "24/7 Dispatch & Patrol",
    contact: "(734) 487-1222",
    desc: "Located at 1200 Oakwood St. Provides 24/7 emergency response, SafeWalk escorts, and lost & found.",
    lng: -83.6318,
    lat: 42.2528,
  },
  {
    id: "poi-4",
    name: "Parking Structures & Commuter Lots",
    type: "Transit & Parking",
    hours: "24/7 Access • ParkEMU",
    contact: "(734) 487-3450",
    desc: "Main commuter parking structure and visitor metered parking adjacent to the Student Center and McKenny.",
    lng: -83.6222,
    lat: 42.2462,
  },
  {
    id: "poi-5",
    name: "Bruce T. Halle Library",
    type: "Library & IT Helpdesk",
    hours: "Open 24/5 During Semesters",
    contact: "(734) 487-0020",
    desc: "Four floors of collaborative & quiet study spaces, University Archives, and Student IT Support Desk.",
    lng: -83.6248,
    lat: 42.2489,
  },
];

const NAV_TABS = [
  { id: "Events", label: "Events" },
  { id: "Food", label: "Food" },
  { id: "Classes", label: "Classes" },
  { id: "Attractions", label: "Attractions" },
  { id: "POIs", label: "POIs" },
  { id: "Chats", label: "Chats" },
];

/* ============================================================================
   MAIN REACT COMPONENT: App
   ============================================================================ */
export default function App() {
  const [activeTab, setActiveTab] = useState("Events");
  const [selectedCampus, setSelectedCampus] = useState("Eastern Michigan University");
  const [mapReady, setMapReady] = useState(false);

  // Firebase Auth & Student Profile State
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [studentProfile, setStudentProfile] = useState({
    displayName: "Eagle Student",
    major: "Undecided",
    level: 5,
    xp: 65,
    attendingEventIds: [],
    claimedXpEventIds: [],
    savedClasses: [
      {
        id: "c-init-1",
        course: "COSC 311",
        building: "Sill Hall",
        time: "MW 10:00 AM",
        lng: -83.6215,
        lat: 42.2482,
      },
    ],
  });

  // Firestore Collections State
  const [events, setEvents] = useState(() =>
    SEED_EVENTS.map((e) => ({ id: e.seedId, ...e }))
  );
  const [requests, setRequests] = useState(() =>
    SEED_REQUESTS.map((r) => ({ id: r.seedId, ...r }))
  );
  const [chatMessages, setChatMessages] = useState([]);

  // Modals & Interactive UI State
  const [selectedEventModal, setSelectedEventModal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Swoop Buddy & Destruction FX State
  const [buddyText, setBuddyText] = useState(
    'Swoop here! Click an event, explore campus tabs, or hit "ATTENDING!!!" to gain XP!'
  );
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [meteorites, setMeteorites] = useState([]);
  const [isDestroying, setIsDestroying] = useState(false);

  // Create Event Form State
  const [newEventForm, setNewEventForm] = useState({
    title: "",
    time: "2026-11-25T17:00",
    badge: "Social",
    location: "EMU Student Center",
    lng: -83.6242,
    lat: 42.2472,
    image:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=600&q=80",
    desc: "",
  });

  // Class Schedule Form State
  const [newClassForm, setNewClassForm] = useState({
    course: "",
    building: "Pray-Harrold",
    time: "TR 11:00 AM",
  });

  // Campus Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatChannel, setChatChannel] = useState("#General");

  // Student Account Auth Form State
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    major: "Computer Science",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Refs
  const mapContainerRef = useRef(null);
  const mapViewRef = useRef(null);
  const graphicsLayerRef = useRef(null);
  const graphicClassRef = useRef(null);
  const hasSeededRef = useRef(false);
  const chatEndRef = useRef(null);

  /* --------------------------------------------------------------------------
     1. INITIALIZE ARCGIS WEBMAP
     -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!document.getElementById("arcgis-430-css")) {
      const arcCss = document.createElement("link");
      arcCss.id = "arcgis-430-css";
      arcCss.rel = "stylesheet";
      arcCss.href = "https://js.arcgis.com/4.30/esri/themes/light/main.css";
      document.head.appendChild(arcCss);
    }

    const initArcGISMap = () => {
      if (!window.require || !mapContainerRef.current || mapViewRef.current) return;

      window.require(
        [
          "esri/WebMap",
          "esri/views/MapView",
          "esri/Graphic",
          "esri/layers/GraphicsLayer",
        ],
        (WebMap, MapView, Graphic, GraphicsLayer) => {
          if (!mapContainerRef.current || mapViewRef.current) return;

          const webMap = new WebMap({
            portalItem: { id: "bf9349e436fd4cdca9f01a2b94390f81" },
          });

          const gLayer = new GraphicsLayer();
          webMap.add(gLayer);

          const view = new MapView({
            container: mapContainerRef.current,
            map: webMap,
            center: CAMPUS_VIEWS["Eastern Michigan University"].center,
            zoom: CAMPUS_VIEWS["Eastern Michigan University"].zoom,
          });

          mapViewRef.current = view;
          graphicsLayerRef.current = gLayer;
          graphicClassRef.current = Graphic;
          setMapReady(true);
        }
      );
    };

    if (window.require) {
      initArcGISMap();
    } else {
      let arcScript = document.getElementById("arcgis-430-js");
      if (!arcScript) {
        arcScript = document.createElement("script");
        arcScript.id = "arcgis-430-js";
        arcScript.src = "https://js.arcgis.com/4.30/";
        arcScript.async = true;
        arcScript.onload = initArcGISMap;
        document.head.appendChild(arcScript);
      } else {
        arcScript.addEventListener("load", initArcGISMap);
      }
    }

    return () => {
      if (mapViewRef.current) {
        mapViewRef.current.destroy();
        mapViewRef.current = null;
      }
    };
  }, []);

  /* --------------------------------------------------------------------------
     2. FIREBASE AUTHENTICATION LIFECYCLE
     -------------------------------------------------------------------------- */
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Firebase Auth bootstrap error:", err);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  /* --------------------------------------------------------------------------
     3. FIRESTORE REAL-TIME LISTENERS & INITIAL SEEDING
     -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!user) return;

    const profileDocRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "profile",
      "student_data"
    );

    const unsubProfile = onSnapshot(
      profileDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStudentProfile((prev) => ({
            ...prev,
            displayName: user.displayName || data.displayName || "Eagle Student",
            major: data.major || prev.major,
            level: typeof data.level === "number" ? data.level : 5,
            xp: typeof data.xp === "number" ? data.xp : 65,
            attendingEventIds: Array.isArray(data.attendingEventIds)
              ? data.attendingEventIds
              : [],
            claimedXpEventIds: Array.isArray(data.claimedXpEventIds)
              ? data.claimedXpEventIds
              : [],
            savedClasses: Array.isArray(data.savedClasses)
              ? data.savedClasses
              : prev.savedClasses,
          }));
        } else {
          const initialProfile = {
            displayName:
              user.displayName ||
              (user.email ? user.email.split("@")[0] : "Eagle Student"),
            email: user.email || "",
            major: "Undecided",
            level: 5,
            xp: 65,
            attendingEventIds: [],
            claimedXpEventIds: [],
            savedClasses: [
              {
                id: "c-init-1",
                course: "COSC 311",
                building: "Sill Hall",
                time: "MW 10:00 AM",
                lng: -83.6215,
                lat: 42.2482,
              },
            ],
          };
          await setDoc(profileDocRef, initialProfile, { merge: true });
        }
      },
      (error) => console.error("Profile listener error:", error)
    );

    const eventsColRef = collection(db, "artifacts", appId, "public", "data", "events");
    const unsubEvents = onSnapshot(
      eventsColRef,
      async (snapshot) => {
        if (snapshot.empty && !hasSeededRef.current) {
          hasSeededRef.current = true;
          for (const item of SEED_EVENTS) {
            await setDoc(
              doc(db, "artifacts", appId, "public", "data", "events", item.seedId),
              { ...item, createdAt: Date.now() }
            );
          }
          for (const reqItem of SEED_REQUESTS) {
            await setDoc(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "event_requests",
                reqItem.seedId
              ),
              { ...reqItem, createdAt: Date.now() }
            );
          }
          return;
        }
        const loadedEvents = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        loadedEvents.sort((a, b) => new Date(a.time) - new Date(b.time));
        setEvents(loadedEvents);
      },
      (error) => console.error("Events listener error:", error)
    );

    const requestsColRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "event_requests"
    );
    const unsubRequests = onSnapshot(
      requestsColRef,
      (snapshot) => {
        const loadedReqs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        loadedReqs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setRequests(loadedReqs);
      },
      (error) => console.error("Requests listener error:", error)
    );

    const chatsColRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "campus_chats"
    );
    const unsubChats = onSnapshot(
      chatsColRef,
      (snapshot) => {
        const loadedChats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        loadedChats.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setChatMessages(loadedChats);
      },
      (error) => console.error("Chats listener error:", error)
    );

    return () => {
      unsubProfile();
      unsubEvents();
      unsubRequests();
      unsubChats();
    };
  }, [user]);

  /* --------------------------------------------------------------------------
     4. PLOT ACTIVE TAB PINS ON ARCGIS MAP AUTOMATICALLY
     -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!mapReady || !graphicsLayerRef.current || !graphicClassRef.current) return;

    const gLayer = graphicsLayerRef.current;
    const Graphic = graphicClassRef.current;
    gLayer.removeAll();

    let itemsToPlot = [];
    if (activeTab === "Events") {
      itemsToPlot = events.map((e) => ({
        title: e.title,
        subtitle: `${e.badge} • ${e.location}`,
        lng: e.lng,
        lat: e.lat,
        color: [0, 102, 51],
      }));
    } else if (activeTab === "Food") {
      itemsToPlot = EMU_FOOD_LOCATIONS.map((f) => ({
        title: f.name,
        subtitle: `${f.tag} • ${f.hours}`,
        lng: f.lng,
        lat: f.lat,
        color: [234, 88, 12],
      }));
    } else if (activeTab === "Classes") {
      itemsToPlot = EMU_ACADEMIC_BUILDINGS.map((b) => ({
        title: `${b.name} (${b.code})`,
        subtitle: b.departments,
        lng: b.lng,
        lat: b.lat,
        color: [37, 99, 235],
      }));
    } else if (activeTab === "Attractions") {
      itemsToPlot = EMU_ATTRACTIONS.map((a) => ({
        title: a.name,
        subtitle: a.category,
        lng: a.lng,
        lat: a.lat,
        color: [147, 51, 234],
      }));
    } else if (activeTab === "POIs") {
      itemsToPlot = EMU_POIS.map((p) => ({
        title: p.name,
        subtitle: `${p.type} • ${p.hours}`,
        lng: p.lng,
        lat: p.lat,
        color: [220, 38, 38],
      }));
    } else if (activeTab === "REQUESTS") {
      itemsToPlot = requests.map((r) => ({
        title: `[Pending] ${r.title}`,
        subtitle: r.location,
        lng: r.lng,
        lat: r.lat,
        color: [234, 179, 8],
      }));
    }

    itemsToPlot.forEach((item) => {
      if (typeof item.lng === "number" && typeof item.lat === "number") {
        const pin = new Graphic({
          geometry: { type: "point", longitude: item.lng, latitude: item.lat },
          symbol: {
            type: "simple-marker",
            color: item.color,
            outline: { color: [255, 255, 255], width: 2 },
            size: 12,
          },
          attributes: {
            Title: item.title,
            Details: item.subtitle,
          },
          popupTemplate: {
            title: "{Title}",
            content: "{Details}",
          },
        });
        gLayer.add(pin);
      }
    });
  }, [mapReady, activeTab, events, requests]);

  useEffect(() => {
    if (activeTab === "Chats" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  /* --------------------------------------------------------------------------
     5. HELPER FUNCTIONS: Notifications, Swoop Buddy, XP, Map Locate
     -------------------------------------------------------------------------- */
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const buddySay = (text) => {
    setBuddyText(text);
    if (voiceEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 1.18;
        utterance.rate = 1.03;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // Ignore browser speech restriction if triggered before interaction
      }
    }
  };

  const handleBuddyClick = () => {
    const quotes = [
      "Swoop here! EMU Eagles fly high in Ypsilanti!",
      "Check out the Food tab for Dining Dollars & Student Center hours!",
      'Submit a campus event with "+ Create Event" to earn +30 XP when approved!',
      "Need to find Pray-Harrold or Sill Hall? Hit Locate on any building card!",
    ];
    buddySay(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  const awardXP = async (amount, customMessage) => {
    let nextXP = studentProfile.xp + amount;
    let nextLevel = studentProfile.level;

    while (nextXP >= 100) {
      nextLevel += 1;
      nextXP -= 100;
    }

    const leveledUp = nextLevel > studentProfile.level;

    setStudentProfile((prev) => ({
      ...prev,
      xp: nextXP,
      level: nextLevel,
    }));

    if (leveledUp) {
      buddySay(`LEVEL UP! You reached Eagle Level ${nextLevel}! 🎉`);
      showToast(`🎉 Level Up! You are now Level ${nextLevel}!`);
    } else if (customMessage) {
      buddySay(customMessage);
    }

    if (user) {
      try {
        const profileRef = doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "profile",
          "student_data"
        );
        await setDoc(profileRef, { xp: nextXP, level: nextLevel }, { merge: true });
      } catch (err) {
        console.error("Failed to persist XP:", err);
      }
    }
  };

  const handleCampusChange = (campusName) => {
    setSelectedCampus(campusName);
    const target = CAMPUS_VIEWS[campusName];
    if (target && mapViewRef.current) {
      mapViewRef.current.goTo({ center: target.center, zoom: target.zoom }, { duration: 900 });
      buddySay(`Zoomed map to ${campusName}!`);
    }
  };

  const handleLocateItem = (lng, lat, label) => {
    if (!mapViewRef.current || !graphicsLayerRef.current || !graphicClassRef.current) {
      showToast("Map is still initializing—try again in a moment!");
      return;
    }

    mapViewRef.current.goTo({ center: [lng, lat], zoom: 18 }, { duration: 1000 });

    const Graphic = graphicClassRef.current;
    const highlightPin = new Graphic({
      geometry: { type: "point", longitude: lng, latitude: lat },
      symbol: {
        type: "simple-marker",
        color: [0, 102, 51],
        outline: { color: [250, 204, 21], width: 3 },
        size: 18,
      },
      attributes: { Title: label },
      popupTemplate: { title: "{Title}", content: "Selected EMU Campus Location" },
    });

    graphicsLayerRef.current.add(highlightPin);
    buddySay(`Pinpointed ${label} on the EMU campus map!`);
  };

  /* --------------------------------------------------------------------------
     6. EVENT ATTENDANCE (ONE-TIME XP LOCK) & GOOGLE CALENDAR SYNC
     -------------------------------------------------------------------------- */
  const handleToggleAttending = async (ev) => {
    const isCurrentlyAttending = studentProfile.attendingEventIds.includes(ev.id);
    const hasAlreadyClaimedXP = studentProfile.claimedXpEventIds.includes(ev.id);
    const delta = isCurrentlyAttending ? -1 : 1;
    const nextCount = Math.max(0, (ev.attendingCount || 0) + delta);

    setStudentProfile((prev) => ({
      ...prev,
      attendingEventIds: isCurrentlyAttending
        ? prev.attendingEventIds.filter((id) => id !== ev.id)
        : [...prev.attendingEventIds, ev.id],
      claimedXpEventIds:
        !isCurrentlyAttending && !hasAlreadyClaimedXP
          ? [...prev.claimedXpEventIds, ev.id]
          : prev.claimedXpEventIds,
    }));

    setEvents((prev) =>
      prev.map((item) => (item.id === ev.id ? { ...item, attendingCount: nextCount } : item))
    );

    if (selectedEventModal && selectedEventModal.id === ev.id) {
      setSelectedEventModal((prev) => ({ ...prev, attendingCount: nextCount }));
    }

    if (!isCurrentlyAttending) {
      if (!hasAlreadyClaimedXP) {
        await awardXP(25, `Awesome! You marked attending for ${ev.title}. +25 XP!`);
      } else {
        buddySay(`Welcome back to ${ev.title}! (XP already claimed for this event.)`);
      }
    } else {
      buddySay(`Removed RSVP for ${ev.title}.`);
    }

    if (user) {
      try {
        const profileRef = doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "profile",
          "student_data"
        );
        const eventRef = doc(db, "artifacts", appId, "public", "data", "events", ev.id);

        if (isCurrentlyAttending) {
          await updateDoc(profileRef, { attendingEventIds: arrayRemove(ev.id) });
        } else {
          const profileUpdates = { attendingEventIds: arrayUnion(ev.id) };
          if (!hasAlreadyClaimedXP) {
            profileUpdates.claimedXpEventIds = arrayUnion(ev.id);
          }
          await updateDoc(profileRef, profileUpdates);
        }

        await updateDoc(eventRef, { attendingCount: nextCount });
      } catch (err) {
        console.error("Error syncing RSVP to Firestore:", err);
      }
    }
  };

  const addToGoogleCalendar = (ev) => {
    const startTime = new Date(ev.time).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      ev.title
    )}&dates=${startTime}/${startTime}&details=${encodeURIComponent(
      ev.desc
    )}&location=${encodeURIComponent(ev.location)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* --------------------------------------------------------------------------
     7. CREATE EVENT & REQUEST APPROVAL WORKFLOW
     -------------------------------------------------------------------------- */
  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: newEventForm.title.trim(),
      time: newEventForm.time,
      badge: newEventForm.badge,
      location: newEventForm.location.trim(),
      lng: parseFloat(newEventForm.lng) || -83.6242,
      lat: parseFloat(newEventForm.lat) || 42.2472,
      image:
        newEventForm.image.trim() ||
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=600&q=80",
      desc: newEventForm.desc.trim(),
      submittedBy: `${studentProfile.displayName} (${studentProfile.major})`,
      createdAt: Date.now(),
    };

    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "event_requests"),
        payload
      );
      setShowCreateModal(false);
      setNewEventForm({
        title: "",
        time: "2026-11-25T17:00",
        badge: "Social",
        location: "EMU Student Center",
        lng: -83.6242,
        lat: 42.2472,
        image:
          "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=600&q=80",
        desc: "",
      });
      setActiveTab("REQUESTS");
      showToast("Event submitted to REQUESTS queue!");
      buddySay("Event submitted! Approve it in the REQUESTS tab to publish it live.");
    } catch (err) {
      console.error("Failed to create event request:", err);
      showToast("Error submitting event request.");
    }
  };

  const handleApproveRequest = async (req) => {
    try {
      const approvedEvent = {
        title: req.title,
        time: req.time,
        location: req.location,
        lng: req.lng,
        lat: req.lat,
        badge: req.badge,
        attendingCount: 1,
        image: req.image,
        desc: req.desc,
        createdAt: Date.now(),
      };

      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "events"),
        approvedEvent
      );
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "event_requests", req.id)
      );

      await awardXP(30, `Approved "${req.title}"! It is now live on the EMU map. +30 XP!`);
      showToast(`Approved "${req.title}" (+30 XP)`);
    } catch (err) {
      console.error("Error approving request:", err);
    }
  };

  const handleDeclineRequest = async (req) => {
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "event_requests", req.id)
      );
      showToast(`Declined request "${req.title}"`);
      buddySay(`Removed "${req.title}" from the pending queue.`);
    } catch (err) {
      console.error("Error declining request:", err);
    }
  };

  /* --------------------------------------------------------------------------
     8. STUDENT CLASS SCHEDULE BUILDER
     -------------------------------------------------------------------------- */
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassForm.course.trim()) return;

    const buildingObj =
      EMU_ACADEMIC_BUILDINGS.find((b) => b.name === newClassForm.building) ||
      EMU_ACADEMIC_BUILDINGS[0];

    const newEntry = {
      id: `cls-${Date.now()}`,
      course: newClassForm.course.trim().toUpperCase(),
      building: buildingObj.name,
      time: newClassForm.time.trim() || "TBD",
      lng: buildingObj.lng,
      lat: buildingObj.lat,
    };

    const updatedClasses = [...studentProfile.savedClasses, newEntry];
    setStudentProfile((prev) => ({ ...prev, savedClasses: updatedClasses }));
    setNewClassForm({ course: "", building: "Pray-Harrold", time: "TR 11:00 AM" });
    await awardXP(15, `Added ${newEntry.course} in ${newEntry.building}! +15 XP!`);

    if (user) {
      try {
        const profileRef = doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "profile",
          "student_data"
        );
        await updateDoc(profileRef, { savedClasses: updatedClasses });
      } catch (err) {
        console.error("Error saving class schedule:", err);
      }
    }
  };

  const handleRemoveClass = async (classId) => {
    const updatedClasses = studentProfile.savedClasses.filter((c) => c.id !== classId);
    setStudentProfile((prev) => ({ ...prev, savedClasses: updatedClasses }));

    if (user) {
      try {
        const profileRef = doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "profile",
          "student_data"
        );
        await updateDoc(profileRef, { savedClasses: updatedClasses });
      } catch (err) {
        console.error("Error removing class:", err);
      }
    }
  };

  /* --------------------------------------------------------------------------
     9. REAL-TIME CAMPUS CHAT
     -------------------------------------------------------------------------- */
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msgPayload = {
      channel: chatChannel,
      sender: studentProfile.displayName,
      major: studentProfile.major,
      level: studentProfile.level,
      text: chatInput.trim(),
      uid: user ? user.uid : "guest",
      createdAt: Date.now(),
    };

    setChatInput("");

    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "campus_chats"),
        msgPayload
      );
      await awardXP(5);
    } catch (err) {
      console.error("Error sending chat message:", err);
    }
  };

  /* --------------------------------------------------------------------------
     10. STUDENT ACCOUNT AUTHENTICATION (SIGN UP / LOGIN / LOGOUT)
     -------------------------------------------------------------------------- */
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    try {
      if (authMode === "signup") {
        const cred = await createUserWithEmailAndPassword(
          auth,
          authForm.email.trim(),
          authForm.password
        );
        const displayName =
          authForm.name.trim() || authForm.email.split("@")[0] || "EMU Eagle";
        await updateProfile(cred.user, { displayName });

        const profileRef = doc(
          db,
          "artifacts",
          appId,
          "users",
          cred.user.uid,
          "profile",
          "student_data"
        );
        await setDoc(
          profileRef,
          {
            displayName,
            email: authForm.email.trim(),
            major: authForm.major || "Undecided",
            level: studentProfile.level,
            xp: studentProfile.xp,
            attendingEventIds: studentProfile.attendingEventIds,
            claimedXpEventIds: studentProfile.claimedXpEventIds,
            savedClasses: studentProfile.savedClasses,
          },
          { merge: true }
        );

        setStudentProfile((prev) => ({
          ...prev,
          displayName,
          major: authForm.major || "Undecided",
        }));
        buddySay(`Welcome to EMU Campus Portal, ${displayName}!`);
        showToast("Student account created and signed in!");
      } else {
        await signInWithEmailAndPassword(
          auth,
          authForm.email.trim(),
          authForm.password
        );
        buddySay("Welcome back, Eagle! Your XP and RSVPs are synced.");
        showToast("Signed in to your EMU student account!");
      }

      setShowAuthModal(false);
      setAuthForm({ name: "", major: "Computer Science", email: "", password: "" });
    } catch (err) {
      setAuthError(err.message.replace("Firebase: ", ""));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await signInAnonymously(auth);
      showToast("Signed out of student account.");
      buddySay("Signed out! Browsing as a guest Eagle.");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  /* --------------------------------------------------------------------------
     11. METEORITE SCREEN DESTRUCTION EASTER EGG
     -------------------------------------------------------------------------- */
  const triggerMeteorites = () => {
    buddySay("MAYDAY! Meteorites incoming! Campus portal core collapsing!");
    setIsDestroying(true);

    for (let i = 0; i < 16; i++) {
      setTimeout(() => {
        const id = `${Date.now()}-${Math.random()}`;
        const left = Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200);
        setMeteorites((prev) => [...prev, { id, left }]);

        setTimeout(() => {
          setMeteorites((prev) => prev.filter((m) => m.id !== id));
        }, 1200);
      }, i * 140);
    }

    setTimeout(() => {
      setIsDestroying(false);
    }, 2800);
  };

  const isSignedInStudent = user && !user.isAnonymous;
  const filteredChats = chatMessages.filter((m) => m.channel === chatChannel);

  return (
    <div
      className={`bg-gray-100 font-sans h-screen flex flex-col overflow-hidden select-none ${
        isDestroying ? "portal-destroying" : ""
      }`}
    >
      {/* Meteorite Shower Overlay */}
      {meteorites.map((m) => (
        <div
          key={m.id}
          className="emu-meteorite"
          style={{ left: `${m.left}px`, top: "-30px" }}
        />
      ))}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-emu-dark text-white px-4 py-2.5 rounded-xl shadow-2xl border border-yellow-400 text-xs font-bold flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================================
          HEADER NAVIGATION BAR
          ====================================================================== */}
      <header className="bg-emu-green text-white shadow-lg z-20">
        <div className="max-w-full mx-auto px-4 lg:px-6 py-3 flex flex-wrap justify-between items-center gap-3">
          {/* Left: Logo & Campus Selector */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-7 h-7 text-yellow-400" />
              <span className="font-bold text-xl tracking-wide">EMU PORTAL</span>
            </div>
            <select
              value={selectedCampus}
              onChange={(e) => handleCampusChange(e.target.value)}
              className="bg-emu-dark text-white text-xs sm:text-sm py-1.5 px-3 rounded border border-green-600 focus:outline-none"
            >
              <option value="Eastern Michigan University">
                Eastern Michigan University
              </option>
              <option value="Main Campus">Main Campus</option>
              <option value="West Campus">West Campus</option>
            </select>
          </div>

          {/* Center: App Navigation Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto">
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-t-lg text-xs sm:text-sm transition-colors ${
                    isActive
                      ? "bg-emu-dark text-white font-semibold border-b-2 border-yellow-400"
                      : "hover:bg-emu-dark text-green-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={() => setActiveTab("REQUESTS")}
              className={`px-3.5 py-2 rounded-t-lg text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-colors ${
                activeTab === "REQUESTS"
                  ? "bg-yellow-400 text-emu-dark ring-2 ring-white"
                  : "bg-yellow-500 hover:bg-yellow-600 text-emu-dark"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>REQUESTS ({requests.length})</span>
            </button>
          </nav>

          {/* Right: Student Account, Leveling System, Destroy & Settings */}
          <div className="flex items-center space-x-3">
            {/* Student Account Pill */}
            {!authReady ? (
              <span className="text-xs text-green-200 px-2">Connecting...</span>
            ) : isSignedInStudent ? (
              <div className="flex items-center space-x-2 bg-emu-dark px-3 py-1.5 rounded-full border border-green-500/60">
                <UserCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-semibold max-w-[110px] truncate">
                  {studentProfile.displayName}
                </span>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="text-green-200 hover:text-white ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-1.5 bg-emu-dark hover:bg-green-900 px-3 py-1.5 rounded-full border border-yellow-400/60 text-xs font-bold text-yellow-300 transition-colors"
              >
                <UserCircle className="w-4 h-4" />
                <span>Sign In / Sign Up</span>
              </button>
            )}

            {/* Leveling Badge */}
            <div className="flex items-center bg-emu-dark px-3 py-1 rounded-full border border-yellow-400/50">
              <Trophy className="w-4 h-4 text-yellow-400 mr-2" />
              <div>
                <div className="text-xs font-bold leading-none text-yellow-400">
                  LVL <span>{studentProfile.level}</span>
                </div>
                <div className="w-16 bg-gray-700 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, studentProfile.xp)}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={triggerMeteorites}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center space-x-1"
              title="Destroy Page"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Destroy</span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="text-green-100 hover:text-white p-1"
              title="Portal Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================================
          MAIN SPLIT WORKSPACE (LEFT PANEL + RIGHT ARCGIS MAP)
          ====================================================================== */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Dynamic Tab Content */}
        <div className="w-full md:w-1/2 p-5 overflow-y-auto emu-scrollbar border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* TAB 1: EVENTS */}
          {activeTab === "Events" && (
            <>
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-extrabold text-emu-dark tracking-tight">
                    EVENTS
                  </h2>
                  <span className="text-xs bg-emu-light text-emu-green font-bold px-2.5 py-1 rounded-full">
                    EMU Campus
                  </span>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-emu-green hover:bg-emu-dark text-white rounded-lg font-bold text-sm shadow flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Event</span>
                </button>
              </div>

              <div className="space-y-4 flex-1 pb-20">
                {events.map((ev) => {
                  const isAttending = studentProfile.attendingEventIds.includes(ev.id);
                  const isXpClaimed = studentProfile.claimedXpEventIds.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden relative flex flex-col lg:flex-row hover:shadow-lg transition-shadow"
                    >
                      <div className="relative lg:w-2/5 h-44 lg:h-auto">
                        <img
                          src={ev.image}
                          alt={ev.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute badge-pop bg-yellow-400 text-emu-dark font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow border border-white uppercase tracking-wider">
                          {ev.badge}
                        </span>
                        <div className="absolute bottom-2 left-2 flex space-x-2">
                          <button
                            onClick={() => addToGoogleCalendar(ev)}
                            className="bg-black/65 hover:bg-black text-white p-1.5 rounded-lg text-xs backdrop-blur-sm"
                            title="Save to Google Calendar"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                          </button>
                          <div className="bg-black/65 text-white px-2 py-1 rounded-lg text-xs backdrop-blur-sm flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{ev.attendingCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 lg:w-3/5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-base">
                              {ev.title}
                            </h3>
                            {isXpClaimed && (
                              <span className="shrink-0 inline-flex items-center space-x-1 text-[10px] font-bold bg-emu-light text-emu-green px-2 py-0.5 rounded-full border border-green-200">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>XP Claimed</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-emu-green font-semibold mb-1 flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {new Date(ev.time).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mb-3 flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            {ev.location}
                          </p>
                        </div>

                        <div className="flex space-x-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => setSelectedEventModal(ev)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleLocateItem(ev.lng, ev.lat, ev.title)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-emu-green text-xs font-bold rounded"
                          >
                            Locate
                          </button>
                          <button
                            onClick={() => handleToggleAttending(ev)}
                            className={`flex-1 py-1.5 ${
                              isAttending ? "bg-yellow-500 text-emu-dark" : "bg-emu-green text-white"
                            } hover:opacity-90 text-xs font-black rounded tracking-wider shadow`}
                          >
                            {isAttending ? "ATTENDING!" : "ATTENDING!!!"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 2: FOOD */}
          {activeTab === "Food" && (
            <div className="space-y-4 pb-20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Utensils className="w-6 h-6 text-emu-green" />
                  <h2 className="text-2xl font-extrabold text-emu-dark">
                    CAMPUS FOOD & DINING
                  </h2>
                </div>
                <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded-full">
                  {EMU_FOOD_LOCATIONS.length} Locations
                </span>
              </div>

              {EMU_FOOD_LOCATIONS.map((spot) => (
                <div
                  key={spot.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{spot.name}</h3>
                      <p className="text-xs text-gray-500">{spot.address}</p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
                      {spot.tag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 my-2 leading-relaxed">
                    {spot.highlights}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-emu-green flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {spot.hours}
                      </p>
                      <p className="text-gray-500">{spot.payment}</p>
                    </div>
                    <button
                      onClick={() => handleLocateItem(spot.lng, spot.lat, spot.name)}
                      className="px-3 py-1.5 bg-emu-green hover:bg-emu-dark text-white font-bold rounded-lg flex items-center space-x-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Locate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: CLASSES */}
          {activeTab === "Classes" && (
            <div className="space-y-5 pb-20">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-emu-green" />
                <h2 className="text-2xl font-extrabold text-emu-dark">
                  CLASSES & ACADEMIC BUILDINGS
                </h2>
              </div>

              {/* Personal Class Schedule Builder */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
                <h3 className="text-sm font-extrabold text-emu-dark mb-3">
                  My EMU Class Schedule (+15 XP per class)
                </h3>
                <form
                  onSubmit={handleAddClass}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3"
                >
                  <input
                    type="text"
                    placeholder="Course (e.g. COSC 481)"
                    value={newClassForm.course}
                    onChange={(e) =>
                      setNewClassForm({ ...newClassForm, course: e.target.value })
                    }
                    required
                    className="px-2.5 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-emu-green outline-none"
                  />
                  <select
                    value={newClassForm.building}
                    onChange={(e) =>
                      setNewClassForm({ ...newClassForm, building: e.target.value })
                    }
                    className="px-2.5 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-emu-green outline-none"
                  >
                    {EMU_ACADEMIC_BUILDINGS.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Days/Time"
                    value={newClassForm.time}
                    onChange={(e) =>
                      setNewClassForm({ ...newClassForm, time: e.target.value })
                    }
                    className="px-2.5 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-emu-green outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emu-green hover:bg-emu-dark text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                <div className="space-y-1.5">
                  {studentProfile.savedClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between bg-emu-light/60 px-3 py-2 rounded-lg text-xs"
                    >
                      <div>
                        <span className="font-bold text-emu-dark">{cls.course}</span>
                        <span className="text-gray-600">
                          {" "}
                          • {cls.building} ({cls.time})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleLocateItem(
                              cls.lng,
                              cls.lat,
                              `${cls.course} - ${cls.building}`
                            )
                          }
                          className="text-emu-green font-bold hover:underline"
                        >
                          Map
                        </button>
                        <button
                          onClick={() => handleRemoveClass(cls.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Buildings Directory */}
              <div className="space-y-3">
                {EMU_ACADEMIC_BUILDINGS.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">
                          {b.name}{" "}
                          <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded ml-1">
                            {b.code}
                          </span>
                        </h3>
                        <p className="text-xs font-semibold text-emu-green mt-0.5">
                          {b.departments}
                        </p>
                      </div>
                      <button
                        onClick={() => handleLocateItem(b.lng, b.lat, b.name)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-emu-green text-xs font-bold rounded-lg flex items-center space-x-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Locate</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{b.desc}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{b.rooms}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ATTRACTIONS */}
          {activeTab === "Attractions" && (
            <div className="space-y-4 pb-20">
              <div className="flex items-center space-x-2 mb-2">
                <Landmark className="w-6 h-6 text-emu-green" />
                <h2 className="text-2xl font-extrabold text-emu-dark">
                  CAMPUS ATTRACTIONS & LANDMARKS
                </h2>
              </div>

              {EMU_ATTRACTIONS.map((attr) => (
                <div
                  key={attr.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{attr.name}</h3>
                      <p className="text-xs text-purple-700 font-semibold">
                        {attr.established}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {attr.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 my-2 leading-relaxed">
                    {attr.desc}
                  </p>
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleLocateItem(attr.lng, attr.lat, attr.name)}
                      className="px-3 py-1.5 bg-emu-green hover:bg-emu-dark text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Locate on Map</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: POIs */}
          {activeTab === "POIs" && (
            <div className="space-y-4 pb-20">
              <div className="flex items-center space-x-2 mb-2">
                <Compass className="w-6 h-6 text-emu-green" />
                <h2 className="text-2xl font-extrabold text-emu-dark">
                  POINTS OF INTEREST & SERVICES
                </h2>
              </div>

              {EMU_POIS.map((poi) => (
                <div
                  key={poi.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{poi.name}</h3>
                      <p className="text-xs text-gray-500">
                        {poi.hours} • {poi.contact}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                      {poi.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 my-2 leading-relaxed">{poi.desc}</p>
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleLocateItem(poi.lng, poi.lat, poi.name)}
                      className="px-3 py-1.5 bg-emu-green hover:bg-emu-dark text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Locate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: CHATS */}
          {activeTab === "Chats" && (
            <div className="flex flex-col h-full pb-20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-6 h-6 text-emu-green" />
                  <h2 className="text-2xl font-extrabold text-emu-dark">CAMPUS CHATS</h2>
                </div>
                <div className="flex space-x-1">
                  {["#General", "#FreeFood", "#StudyGroup", "#GameDay"].map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setChatChannel(ch)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        chatChannel === ch
                          ? "bg-emu-green text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto emu-scrollbar space-y-3 mb-3">
                {filteredChats.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">
                    No messages in {chatChannel} yet. Start the conversation (+5 XP)!
                  </p>
                ) : (
                  filteredChats.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-emu-dark">
                          {msg.sender}{" "}
                          <span className="text-[10px] font-semibold text-emu-green bg-emu-light px-1.5 py-0.5 rounded">
                            LVL {msg.level || 1}
                          </span>
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-800">{msg.text}</p>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendChat} className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Message ${chatChannel} as ${studentProfile.displayName}...`}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emu-green outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emu-green hover:bg-emu-dark text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 7: REQUESTS */}
          {activeTab === "REQUESTS" && (
            <div className="space-y-4 pb-20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Bell className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-2xl font-extrabold text-emu-dark">
                    EVENT APPROVAL QUEUE
                  </h2>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-900 font-bold px-2.5 py-1 rounded-full">
                  {requests.length} Pending
                </span>
              </div>

              {requests.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                  <p className="text-sm font-bold text-gray-700">
                    All student event requests have been reviewed!
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Use "+ Create Event" in the Events tab to submit a new campus event.
                  </p>
                </div>
              ) : (
                requests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-yellow-300 flex flex-col sm:flex-row gap-4"
                  >
                    <img
                      src={req.image}
                      alt={req.title}
                      className="w-full sm:w-32 h-28 object-cover rounded-lg"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-900 text-base">
                            {req.title}
                          </h3>
                          <span className="text-[10px] font-extrabold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded uppercase">
                            {req.badge}
                          </span>
                        </div>
                        <p className="text-xs text-emu-green font-semibold mt-0.5">
                          {new Date(req.time).toLocaleString()} • {req.location}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Submitted by: {req.submittedBy || "EMU Student"}
                        </p>
                        <p className="text-xs text-gray-700 mt-2">{req.desc}</p>
                      </div>

                      <div className="flex justify-end space-x-2 mt-3 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleLocateItem(req.lng, req.lat, req.title)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
                        >
                          Locate
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg flex items-center space-x-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                        <button
                          onClick={() => handleApproveRequest(req)}
                          className="px-4 py-1.5 bg-emu-green hover:bg-emu-dark text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve (+30 XP)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Side: ArcGIS Map */}
        <div className="w-full md:w-1/2 relative h-80 md:h-auto">
          <div id="emuMapView" ref={mapContainerRef} />
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow border border-gray-200 text-[11px] font-bold text-emu-dark flex items-center space-x-1.5">
            <Navigation className="w-3.5 h-3.5 text-emu-green" />
            <span>ArcGIS Live • {activeTab} Layer</span>
          </div>
        </div>
      </div>

      {/* ======================================================================
          INTERACTIVE SWOOP BUDDY (BOTTOM LEFT)
          ====================================================================== */}
      <div className="fixed bottom-4 left-4 z-40 flex items-end space-x-3 pointer-events-none">
        <button
          onClick={handleBuddyClick}
          className="buddy-avatar-float w-14 h-14 bg-emu-green border-4 border-yellow-400 rounded-full flex items-center justify-center shadow-2xl cursor-pointer pointer-events-auto hover:scale-110 transition-transform text-white font-black text-lg"
          title="Click Swoop Buddy for Campus Tips!"
        >
          EMU
        </button>
        <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-200 max-w-xs text-xs text-gray-800 pointer-events-auto relative mb-1">
          <div className="flex justify-between items-center mb-1">
            <span className="font-extrabold text-[10px] uppercase tracking-wider text-emu-green">
              Swoop Campus Guide
            </span>
            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              className="text-gray-400 hover:text-emu-green"
              title={voiceEnabled ? "Mute Voice" : "Unmute Voice"}
            >
              {voiceEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p>{buddyText}</p>
        </div>
      </div>

      {/* ======================================================================
          MODAL 1: EVENT DETAILS
          ====================================================================== */}
      {selectedEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border-t-8 border-emu-green">
            <img
              className="w-full h-48 object-cover"
              src={selectedEventModal.image}
              alt={selectedEventModal.title}
            />
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedEventModal.title}
                </h3>
                <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded font-bold text-xs">
                  {selectedEventModal.badge}
                </span>
              </div>
              <p className="text-xs font-semibold text-emu-green mb-1">
                {new Date(selectedEventModal.time).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                {selectedEventModal.location} • {selectedEventModal.attendingCount}{" "}
                Eagles attending
              </p>
              {studentProfile.claimedXpEventIds.includes(selectedEventModal.id) && (
                <p className="text-xs font-bold text-emu-green bg-emu-light px-2.5 py-1 rounded mb-3 inline-flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+25 XP already claimed for this event</span>
                </p>
              )}
              <p className="text-gray-700 text-sm leading-relaxed mb-6">
                {selectedEventModal.desc}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedEventModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={() => handleToggleAttending(selectedEventModal)}
                  className="px-5 py-2 bg-emu-green text-white rounded-lg text-sm font-bold hover:bg-emu-dark shadow"
                >
                  {studentProfile.attendingEventIds.includes(selectedEventModal.id)
                    ? "ATTENDING!"
                    : "ATTENDING!!!"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 2: CREATE CAMPUS EVENT
          ====================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-8 border-emu-green max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-emu-dark mb-4">
              Create Campus Event
            </h3>
            <form onSubmit={handleCreateEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  required
                  value={newEventForm.title}
                  onChange={(e) =>
                    setNewEventForm({ ...newEventForm, title: e.target.value })
                  }
                  placeholder="e.g., EMU Hackathon Kickoff"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newEventForm.time}
                    onChange={(e) =>
                      setNewEventForm({ ...newEventForm, time: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Badge
                  </label>
                  <select
                    value={newEventForm.badge}
                    onChange={(e) =>
                      setNewEventForm({ ...newEventForm, badge: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Social">Social</option>
                    <option value="Sports">Sports</option>
                    <option value="Free Food">Free Food</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  required
                  value={newEventForm.location}
                  onChange={(e) =>
                    setNewEventForm({ ...newEventForm, location: e.target.value })
                  }
                  placeholder="e.g., EMU Student Center"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newEventForm.lng}
                    onChange={(e) =>
                      setNewEventForm({ ...newEventForm, lng: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newEventForm.lat}
                    onChange={(e) =>
                      setNewEventForm({ ...newEventForm, lat: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  required
                  value={newEventForm.image}
                  onChange={(e) =>
                    setNewEventForm({ ...newEventForm, image: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  required
                  value={newEventForm.desc}
                  onChange={(e) =>
                    setNewEventForm({ ...newEventForm, desc: e.target.value })
                  }
                  placeholder="Tell fellow Eagles what to expect..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emu-green text-white rounded-lg text-sm font-bold hover:bg-emu-dark"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 3: STUDENT ACCOUNT SIGN IN / SIGN UP
          ====================================================================== */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-8 border-emu-green">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-emu-dark">
                {authMode === "login"
                  ? "EMU Student Sign In"
                  : "Create EMU Student Account"}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-lg mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
                className={`flex-1 py-1.5 rounded-md ${
                  authMode === "login" ? "bg-white text-emu-dark shadow" : "text-gray-500"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setAuthError("");
                }}
                className={`flex-1 py-1.5 rounded-md ${
                  authMode === "signup" ? "bg-white text-emu-dark shadow" : "text-gray-500"
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === "signup" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Student Name
                    </label>
                    <input
                      type="text"
                      required
                      value={authForm.name}
                      onChange={(e) =>
                        setAuthForm({ ...authForm, name: e.target.value })
                      }
                      placeholder="e.g., Swoop Eagle"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Major / Program
                    </label>
                    <input
                      type="text"
                      value={authForm.major}
                      onChange={(e) =>
                        setAuthForm({ ...authForm, major: e.target.value })
                      }
                      placeholder="e.g., Computer Science"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, email: e.target.value })
                  }
                  placeholder="student@emich.edu"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emu-green outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-2.5 bg-emu-green hover:bg-emu-dark text-white rounded-lg text-sm font-bold shadow mt-2 disabled:opacity-60"
              >
                {authSubmitting
                  ? "Connecting to Firebase..."
                  : authMode === "login"
                  ? "Sign In"
                  : "Create Student Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 4: PORTAL SETTINGS
          ====================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-8 border-emu-green">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-emu-dark">
                Student Portal Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emu-light rounded-lg">
                <p className="font-bold text-emu-dark">
                  Connected Firebase Project: {firebaseConfig.projectId}
                </p>
                <p className="text-gray-600 mt-0.5">
                  Account Status:{" "}
                  {isSignedInStudent
                    ? `Signed in (${user.email})`
                    : "Guest Session (Sign up to sync across devices)"}
                </p>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-bold text-gray-700">
                  Swoop Buddy Voice Synthesis
                </span>
                <button
                  onClick={() => setVoiceEnabled((v) => !v)}
                  className={`px-3 py-1 rounded-full font-bold ${
                    voiceEnabled
                      ? "bg-emu-green text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {voiceEnabled ? "Enabled" : "Muted"}
                </button>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-emu-green text-white rounded-lg font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
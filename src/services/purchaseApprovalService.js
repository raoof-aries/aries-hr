// Purchase & Management Approval Service
// Self-contained data management with localStorage persistence and seamless integration with HRMS user session.

const STORAGE_KEY_PENDING = "pwa_approval_pending_items";
const STORAGE_KEY_APPROVED = "pwa_approval_approved_items";

const INITIAL_PENDING_ITEMS = [
  {
    requesting_id: 101,
    request_no: "PR-2026-0482",
    req_id: "Supply and installation of Marine VHF Transceiver & Antenna for Tug Vessel Aries 21",
    request_type_name: "Capital Equipment Requisition",
    requester_name: "Capt. Rajesh Kumar",
    requesting_date: "2026-09-28",
    supplier_name: "Gulf Marine Communications LLC",
    final_amount: 14850.0,
    final_amount_currency: "AED",
    next_action_code: "MANAGEMENT_APPROVAL",
    category_code: "APR",
    location_name: "Dubai Maritime City, Berth 4",
    subdivision_id: 1,
    subdivision_name: "Marine Services",
    job_no: "JB-2026-9042",
    work_order_no: "WO-MRN-442",
    expected_delivery_date: "2026-10-12",
    approved_by_display: "Technical Superintendent",
    supplier_remarks: "Authorized dealer with standard 2-year warranty & on-site marine survey",
    quote_compare: "Done",
    quote_compare_reason: "Lowest evaluated price among 3 certified marine suppliers",
    discount_by_division: "1200",
    discount_by_division_currency: "AED",
    management_approval_status: 0,
    description: "Urgent replacement for faulty communication unit onboard Tug Aries 21 to meet statutory class survey requirements prior to departure.",
    lpono: "LPO-2026-0819",
    lpo_amount: "14850.00",
    lpo_amount_currency: "AED",
    lpo_generated_date: "2026-09-29",
    quotes: [
      { quote_level: "Level 1 (Direct Tech)", quote_amount: "17500.00", quote_tax_per: "5%", currency: "AED", quote_file: "" },
      { quote_level: "Level 2 (Maritronics)", quote_amount: "16050.00", quote_tax_per: "5%", currency: "AED", quote_file: "" }
    ],
    finalQuotes: [
      { quote_level: "Final Evaluated (Gulf Marine)", quote_amount: "14850.00", quote_tax_per: "5%", currency: "AED", quote_file: "" }
    ],
    discounts: [
      { display_name: "Technical Superintendent", discount_amount: 700 },
      { display_name: "Purchase Head", discount_amount: 500 }
    ],
    totalDiscount: 1200,
    split: [
      { category1_name: "Navigation & Radio Equipment", split_amount1: 14850.0 }
    ],
    attachments: [
      { title: "Class Survey Defect Notice.pdf", file: "survey_defect.pdf" },
      { title: "Supplier Comparative Quote.pdf", file: "quote_comp.pdf" }
    ],
    priorRemarks: "Essential for seaworthiness certification. Recommended for prompt approval.",
    finalRemarks: [
      { full_name: "Divisional Purchase Officer", remarks: "Prices negotiate down by 7.5% from initial quote." }
    ],
    actionsLog: [
      { label: "Requisition Raised", status_label: "Submitted", colour: "blue", username: "Capt. Rajesh Kumar", created_at: "2026-09-28 09:30:00", remarks: "Raised for tug vessel certification." },
      { label: "Technical Review", status_label: "Endorsed", colour: "green", username: "Eng. Farhan Ali", created_at: "2026-09-28 14:15:00", remarks: "Specifications verified and compliant." }
    ]
  },
  {
    requesting_id: 102,
    request_no: "PR-2026-0485",
    req_id: "Ultrasonic Phased Array Testing Probes and Calibration Blocks for NDT Field Inspections",
    request_type_name: "Inspection Equipment",
    requester_name: "Suresh Menon",
    requesting_date: "2026-09-29",
    supplier_name: "Olympus Middle East FZCO",
    final_amount: 32400.0,
    final_amount_currency: "AED",
    next_action_code: "MANAGEMENT_APPROVAL",
    category_code: "APR",
    location_name: "Sharjah Testing Laboratory",
    subdivision_id: 2,
    subdivision_name: "NDT & Inspection",
    job_no: "JB-2026-8812",
    work_order_no: "WO-NDT-109",
    expected_delivery_date: "2026-10-18",
    approved_by_display: "NDT Operations Manager",
    supplier_remarks: "OEM equipment required to maintain ISO/IEC 17025 accreditation standards",
    quote_compare: "Done",
    quote_compare_reason: "Sole certified distributor for Olympus NDT probes in the UAE",
    discount_by_division: "2600",
    discount_by_division_currency: "AED",
    management_approval_status: 0,
    description: "Probes required for upcoming offshore pipeline inspection contracts in Abu Dhabi.",
    lpono: "LPO-2026-0824",
    lpo_amount: "32400.00",
    lpo_amount_currency: "AED",
    lpo_generated_date: "2026-09-30",
    quotes: [
      { quote_level: "Initial Quote", quote_amount: "35000.00", quote_tax_per: "5%", currency: "AED", quote_file: "" }
    ],
    finalQuotes: [
      { quote_level: "Negotiated Quote", quote_amount: "32400.00", quote_tax_per: "5%", currency: "AED", quote_file: "" }
    ],
    discounts: [
      { display_name: "Operations Head", discount_amount: 2600 }
    ],
    totalDiscount: 2600,
    split: [
      { category1_name: "Non-Destructive Testing Assets", split_amount1: 32400.0 }
    ],
    attachments: [
      { title: "Equipment Specifications Sheet.pdf", file: "olympus_spec.pdf" }
    ],
    priorRemarks: "Approved by QA department for compliance with client contract terms.",
    finalRemarks: [
      { full_name: "Commercial Head", remarks: "Budget is allocated under Q4 Capex." }
    ],
    actionsLog: [
      { label: "Requisition Raised", status_label: "Submitted", colour: "blue", username: "Suresh Menon", created_at: "2026-09-29 11:00:00", remarks: "Required for ADNOC pipeline survey." }
    ]
  },
  {
    requesting_id: 103,
    request_no: "PR-2026-0490",
    req_id: "AutoCAD & Naval Architecture Analysis Software Licenses Renewal (10 Floating Seats)",
    request_type_name: "Software & IT Licenses",
    requester_name: "Elena Rostova",
    requesting_date: "2026-09-30",
    supplier_name: "Autodesk ME Regional Partner",
    final_amount: 58000.0,
    final_amount_currency: "AED",
    next_action_code: "MANAGEMENT_APPROVAL",
    category_code: "CER",
    location_name: "Head Office - Design Center",
    subdivision_id: 3,
    subdivision_name: "Design & Engineering",
    job_no: "JB-2026-ENG-01",
    work_order_no: "WO-ENG-301",
    expected_delivery_date: "2026-10-05",
    approved_by_display: "Engineering Director",
    supplier_remarks: "Annual enterprise renewal with multi-user floating license server support",
    quote_compare: "Done",
    quote_compare_reason: "Direct principal partner agreement",
    discount_by_division: "5000",
    discount_by_division_currency: "AED",
    management_approval_status: 0,
    description: "Annual maintenance renewal for hull structure design and 3D modeling workstations.",
    lpono: "LPO-2026-0831",
    lpo_amount: "58000.00",
    lpo_amount_currency: "AED",
    lpo_generated_date: "2026-09-30",
    quotes: [
      { quote_level: "List Price", quote_amount: "63000.00", quote_tax_per: "5%", currency: "AED", quote_file: "" }
    ],
    finalQuotes: [
      { quote_level: "Enterprise Discounted", quote_amount: "58000.00", quote_tax_per: "5%", currency: "AED", quote_file: "" }
    ],
    discounts: [
      { display_name: "IT Infrastructure Manager", discount_amount: 5000 }
    ],
    totalDiscount: 5000,
    split: [
      { category1_name: "Software & Subscription", split_amount1: 58000.0 }
    ],
    attachments: [
      { title: "Autodesk Annual Renewal Quote.pdf", file: "autodesk_renewal.pdf" }
    ],
    priorRemarks: "Critical software renewal; licenses expire within 10 days.",
    finalRemarks: [
      { full_name: "IT Director", remarks: "All license keys verified and ready for deployment." }
    ],
    actionsLog: [
      { label: "Requisition Raised", status_label: "Submitted", colour: "blue", username: "Elena Rostova", created_at: "2026-09-30 16:20:00", remarks: "Renewal requested." }
    ]
  },
  {
    requesting_id: 104,
    request_no: "PR-2026-0498",
    req_id: "Hydrostatic Pressure Test Pump Kit (up to 15,000 PSI) for Offshore Piping Systems",
    request_type_name: "Workshop Equipment",
    requester_name: "Mohammed Tariq",
    requesting_date: "2026-10-01",
    supplier_name: "Hi-Force Hydraulics Dubai",
    final_amount: 19750.0,
    final_amount_currency: "AED",
    next_action_code: "MANAGEMENT_APPROVAL",
    category_code: "APR",
    location_name: "Ras Al Khaimah Yard",
    subdivision_id: 1,
    subdivision_name: "Marine Services",
    job_no: "JB-2026-RAK-77",
    work_order_no: "WO-MRN-490",
    expected_delivery_date: "2026-10-20",
    approved_by_display: "Yard Operations Manager",
    supplier_remarks: "Includes calibration certificate and high-pressure flex hoses",
    quote_compare: "Done",
    quote_compare_reason: "Best warranty and local stock availability",
    discount_by_division: "1500",
    discount_by_division_currency: "AED",
    management_approval_status: 0,
    description: "Required for pipeline pressure testing on dry-docked barges.",
    lpono: "LPO-2026-0840",
    lpo_amount: "19750.00",
    lpo_amount_currency: "AED",
    lpo_generated_date: "2026-10-01",
    quotes: [
      { quote_level: "Vendor 1 (Enerpac)", quote_amount: "23000.00", quote_tax_per: "5%", currency: "AED", quote_file: "" },
      { quote_level: "Vendor 2 (Hi-Force)", quote_amount: "21250.00", quote_tax_per: "5%", currency: "AED", quote_file: "" }
    ],
    finalQuotes: [
      { quote_level: "Final (Hi-Force)", quote_amount: "19750.00", quote_tax_per: "5%", currency: "AED", quote_file: "" }
    ],
    discounts: [
      { display_name: "Yard Manager", discount_amount: 1500 }
    ],
    totalDiscount: 1500,
    split: [
      { category1_name: "Hydraulic Testing Tools", split_amount1: 19750.0 }
    ],
    attachments: [
      { title: "Technical Datasheet.pdf", file: "datasheet_hydro.pdf" }
    ],
    priorRemarks: "Standard equipment needed for yard operations.",
    finalRemarks: [
      { full_name: "Procurement Lead", remarks: "Immediate stock available in JAFZA." }
    ],
    actionsLog: [
      { label: "Requisition Raised", status_label: "Submitted", colour: "blue", username: "Mohammed Tariq", created_at: "2026-10-01 08:30:00", remarks: "Urgent requirement for barge overhaul." }
    ]
  }
];

const INITIAL_APPROVED_ITEMS = [
  {
    requesting_id: 81,
    request_no: "PR-2026-0391",
    req_id: "Supply of Industrial Grade Marine Lubricants (Shell Rimula R4 X 15W-40)",
    converted_amount_aed: 38400.0,
    management_approval: "2026-09-15 14:10:00",
    subdivision_id: 1,
    subdivision_name: "Marine Services"
  },
  {
    requesting_id: 82,
    request_no: "PR-2026-0402",
    req_id: "Annual Service & Hydrostatic Recertification for Life Rafts (6 Units)",
    converted_amount_aed: 18200.0,
    management_approval: "2026-09-18 10:45:00",
    subdivision_id: 1,
    subdivision_name: "Marine Services"
  },
  {
    requesting_id: 83,
    request_no: "PR-2026-0415",
    req_id: "Magnetic Particle Testing Consumables & Fluorescent Inks Bulk Order",
    converted_amount_aed: 12500.0,
    management_approval: "2026-09-20 16:30:00",
    subdivision_id: 2,
    subdivision_name: "NDT & Inspection"
  },
  {
    requesting_id: 84,
    request_no: "PR-2026-0428",
    req_id: "High-Performance Workstation Upgrades for CFD Hydrodynamic Simulations",
    converted_amount_aed: 45000.0,
    management_approval: "2026-09-22 11:20:00",
    subdivision_id: 3,
    subdivision_name: "Design & Engineering"
  },
  {
    requesting_id: 85,
    request_no: "PR-2026-0435",
    req_id: "Digital Thickness Gauge Probes Replacement (5 Sets)",
    converted_amount_aed: 15600.0,
    management_approval: "2026-09-24 09:15:00",
    subdivision_id: 2,
    subdivision_name: "NDT & Inspection"
  }
];

const FORWARD_USERS = [
  { user_id: 101, full_name: "Managing Director" },
  { user_id: 102, full_name: "Finance Director" },
  { user_id: 103, full_name: "Chief Operating Officer" },
  { user_id: 104, full_name: "General Manager - Operations" },
  { user_id: 105, full_name: "Technical Director" }
];

const CLARIFICATION_USERS = [
  { user_id: 201, full_name: "Capt. Rajesh Kumar (Marine Requester)" },
  { user_id: 202, full_name: "Suresh Menon (NDT Requester)" },
  { user_id: 203, full_name: "Elena Rostova (Design Lead)" },
  { user_id: 204, full_name: "Mohammed Tariq (Yard Requester)" },
  { user_id: 205, full_name: "Head of Procurement" }
];

function getPendingStorage() {
  const data = localStorage.getItem(STORAGE_KEY_PENDING);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(INITIAL_PENDING_ITEMS));
  return INITIAL_PENDING_ITEMS;
}

function getApprovedStorage() {
  const data = localStorage.getItem(STORAGE_KEY_APPROVED);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY_APPROVED, JSON.stringify(INITIAL_APPROVED_ITEMS));
  return INITIAL_APPROVED_ITEMS;
}

function savePendingStorage(items) {
  localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(items));
}

function saveApprovedStorage(items) {
  localStorage.setItem(STORAGE_KEY_APPROVED, JSON.stringify(items));
}

export async function getApprovalStats(from, to) {
  const pending = getPendingStorage();
  const approved = getApprovedStorage();

  let filteredApproved = approved;
  if (from && to) {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    filteredApproved = approved.filter((item) => {
      const itemDate = new Date(item.management_approval || "");
      if (isNaN(itemDate.getTime())) return true;
      return itemDate >= fromDate && itemDate <= toDate;
    });
  }

  const approvedTotalAed = filteredApproved.reduce(
    (sum, item) => sum + Number(item.converted_amount_aed || 0),
    0
  );

  const subdivMap = {};
  for (const item of filteredApproved) {
    const sid = item.subdivision_id || "other";
    const sname = item.subdivision_name || "General & Operations";
    if (!subdivMap[sid]) {
      subdivMap[sid] = { subdivision_id: sid, subdivision_name: sname, total_amount: 0 };
    }
    subdivMap[sid].total_amount += Number(item.converted_amount_aed || 0);
  }

  const subdivisions = Object.values(subdivMap);

  return {
    pending_total: pending.length,
    approved_count: filteredApproved.length,
    approved_amount_aed: approvedTotalAed,
    approval_limit_monthly: 500000.0,
    currency: "AED",
    subdivisions,
  };
}

export async function getPendingApprovals() {
  return getPendingStorage();
}

export async function getApprovedDetails(from, to, subdivisionId) {
  const approved = getApprovedStorage();
  let filtered = approved;

  if (from && to) {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.management_approval || "");
      if (isNaN(itemDate.getTime())) return true;
      return itemDate >= fromDate && itemDate <= toDate;
    });
  }

  if (subdivisionId !== null && typeof subdivisionId !== "undefined" && subdivisionId !== "other") {
    filtered = filtered.filter((item) => String(item.subdivision_id) === String(subdivisionId));
  }

  return filtered;
}

export async function getActionContext(requestId) {
  const pending = getPendingStorage();
  const item = pending.find((p) => String(p.requesting_id) === String(requestId));

  if (!item) {
    const approved = getApprovedStorage();
    const approvedItem = approved.find((p) => String(p.requesting_id) === String(requestId));
    if (approvedItem) {
      return {
        requestingId: approvedItem.requesting_id,
        nextActionCode: "MANAGEMENT_APPROVAL",
        canApprove: false,
        canApproveWithCc: false,
        totalMonthAmount: 129700.0,
        totalYearAmount: 780000.0,
        balanceLimit: 370300.0,
        rate: 1,
        aedAmount: approvedItem.converted_amount_aed,
        downloadBase: "https://purchaseapproval.markndget.com/uploads/",
        purchase: {
          request_no: approvedItem.request_no,
          req_id: approvedItem.req_id,
          final_amount: approvedItem.converted_amount_aed,
          final_amount_currency: "AED",
          management_approval_status: 1,
          category_code: "APR",
          subdivision_name: approvedItem.subdivision_name,
        },
        approver: {
          approval_limit: 100000.0,
          approval_limit_monthly: 500000.0,
          currency: "AED",
        },
        discounts: [],
        totalDiscount: 0,
        quotes: [],
        finalQuotes: [],
        split: [],
        attachments: [],
        priorRemarks: "",
        finalRemarks: [],
        actionsLog: [],
        forwardTo: FORWARD_USERS,
        needClarification: CLARIFICATION_USERS,
      };
    }
    throw new Error("Request not found");
  }

  return {
    requestingId: item.requesting_id,
    nextActionCode: item.next_action_code || "MANAGEMENT_APPROVAL",
    canApprove: true,
    canApproveWithCc: true,
    totalMonthAmount: 129700.0,
    totalYearAmount: 780000.0,
    balanceLimit: 370300.0,
    rate: 1,
    aedAmount: item.final_amount,
    downloadBase: "https://purchaseapproval.markndget.com/uploads/",
    purchase: item,
    approver: {
      approval_limit: 100000.0,
      approval_limit_monthly: 500000.0,
      currency: "AED",
    },
    discounts: item.discounts || [],
    totalDiscount: item.totalDiscount || 0,
    quotes: item.quotes || [],
    finalQuotes: item.finalQuotes || [],
    split: item.split || [],
    attachments: item.attachments || [],
    priorRemarks: item.priorRemarks || "",
    finalRemarks: item.finalRemarks || [],
    actionsLog: item.actionsLog || [],
    forwardTo: FORWARD_USERS,
    needClarification: CLARIFICATION_USERS,
  };
}

export async function submitDecision({
  requesting_id,
  decision,
  remarks,
  forward_to,
  clarify_to,
  userName = "Approver",
}) {
  const pending = getPendingStorage();
  const approved = getApprovedStorage();

  const index = pending.findIndex((p) => String(p.requesting_id) === String(requesting_id));
  if (index === -1) {
    throw new Error("Request no longer in pending queue.");
  }

  const item = pending[index];
  const now = new Date();
  const nowStr =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0") +
    " " +
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0") +
    ":" +
    String(now.getSeconds()).padStart(2, "0");

  const decisionLabels = {
    AP: "Approved",
    AC: "Approved with CC",
    FW: "Forwarded",
    CA: "Cancelled",
    NC: "Clarification Requested",
    R: "Rejected",
  };

  const statusLabel = decisionLabels[decision] || "Action Taken";

  // Remove from pending
  const nextPending = [...pending];
  nextPending.splice(index, 1);
  savePendingStorage(nextPending);

  // If approved, add to approved list
  if (decision === "AP" || decision === "AC") {
    const nextApproved = [
      {
        requesting_id: item.requesting_id,
        request_no: item.request_no,
        req_id: item.req_id,
        converted_amount_aed: Number(item.final_amount),
        management_approval: nowStr,
        subdivision_id: item.subdivision_id || 1,
        subdivision_name: item.subdivision_name || "General",
      },
      ...approved,
    ];
    saveApprovedStorage(nextApproved);
  }

  return {
    success: true,
    message: `${statusLabel} successfully recorded.`,
  };
}

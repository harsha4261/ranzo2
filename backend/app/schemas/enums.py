"""
Enums and lookup tables for the Ranzo platform.
"""
from enum import Enum
from typing import Dict, List


class UserRole(str, Enum):
    customer = "customer"
    technician = "technician"
    seeker = "seeker"
    employer = "employer"


class OTPPurpose(str, Enum):
    register = "register"
    login = "login"
    forgot_password = "forgot_password"


# ──────────────────────────────────────────────
# Technician skills — predefined set
# ──────────────────────────────────────────────

class TechnicianSkill(str, Enum):
    plumber = "plumber"
    ac_technician = "ac_technician"
    electrician = "electrician"
    carpenter = "carpenter"
    painter = "painter"
    mason = "mason"
    welder = "welder"
    cleaner = "cleaner"
    cook = "cook"
    pest_control = "pest_control"
    geyser_repair = "geyser_repair"
    refrigerator_repair = "refrigerator_repair"
    tv_repair = "tv_repair"
    washing_machine_repair = "washing_machine_repair"


# ──────────────────────────────────────────────
# Job portal categories & their valid roles
# ──────────────────────────────────────────────

class JobCategory(str, Enum):
    it_technology = "it_technology"
    construction = "construction"
    healthcare = "healthcare"
    education = "education"
    retail_sales = "retail_sales"
    hospitality = "hospitality"
    manufacturing = "manufacturing"
    transportation = "transportation"
    home_services = "home_services"
    finance_banking = "finance_banking"
    agriculture = "agriculture"
    security_services = "security_services"
    media_entertainment = "media_entertainment"

CATEGORY_ROLES: Dict[str, List[str]] = {
    "it_technology": [
        "software_developer", "data_analyst", "system_admin",
        "ui_ux_designer", "qa_engineer", "devops_engineer", "cybersecurity_analyst",
    ],
    "construction": [
        "civil_engineer", "site_supervisor", "mason",
        "carpenter", "plumber", "surveyor", "foreman",
    ],
    "healthcare": [
        "nurse", "pharmacist", "lab_technician",
        "medical_assistant", "doctor", "physiotherapist",
    ],
    "education": [
        "teacher", "tutor", "school_administrator",
        "curriculum_developer", "counselor",
    ],
    "retail_sales": [
        "sales_associate", "store_manager", "cashier",
        "inventory_manager", "visual_merchandiser",
    ],
    "hospitality": [
        "chef", "waiter", "hotel_manager",
        "housekeeper", "receptionist", "event_coordinator",
    ],
    "manufacturing": [
        "machine_operator", "quality_inspector", "production_supervisor",
        "welder", "assembler",
    ],
    "transportation": [
        "driver", "delivery_executive", "logistics_coordinator",
        "fleet_manager", "dispatcher",
    ],
    "finance_banking": [
        "accountant", "financial_analyst", "loan_officer",
        "insurance_agent", "teller",
    ],
    "agriculture": [
        "farmer", "agronomist", "irrigation_specialist",
        "farm_manager", "horticulturist",
    ],
    "security_services": [
        "security_guard", "cctv_operator", "security_supervisor", "bouncer",
    ],
    "media_entertainment": [
        "photographer", "videographer", "content_creator",
        "graphic_designer", "journalist",
    ],
}

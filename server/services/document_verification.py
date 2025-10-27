"""
Document Verification Service using LLM for insurance applications
Handles document information extraction, entity matching, and classification
"""

import os
from typing import Dict, Any, List, Optional
import json
from datetime import datetime
import base64
import io

class DocumentVerificationService:
    """Service for LLM-based document verification"""
    
    @staticmethod
    def extract_document_info(file_content: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        """
        Extract information from uploaded documents using LLM/OCR
        
        Args:
            file_content: Binary content of the document
            filename: Original filename
            content_type: MIME type of the document
            
        Returns:
            Dictionary containing extracted information
        """
        try:
            # For now, we'll use a simulated extraction
            # In production, you'd integrate with OpenAI Vision API, AWS Textract, or similar
            
            extracted_data = {
                "filename": filename,
                "content_type": content_type,
                "file_size": len(file_content),
                "extraction_timestamp": datetime.now().isoformat(),
                "extracted_fields": {},
                "document_type": DocumentVerificationService._classify_document(filename, content_type),
                "confidence_score": 0.85,
                "ocr_text": ""
            }
            
            # Simulate document type-specific extraction
            doc_type = extracted_data["document_type"]
            
            if doc_type == "ID_PROOF":
                extracted_data["extracted_fields"] = {
                    "document_number": "SIMULATED-ID-12345",
                    "full_name": "Extracted from document",
                    "date_of_birth": "1990-01-01",
                    "address": "Extracted address from ID",
                    "issue_date": "2020-01-01",
                    "expiry_date": "2030-01-01"
                }
            elif doc_type == "INCOME_PROOF":
                extracted_data["extracted_fields"] = {
                    "employer_name": "Extracted Company Name",
                    "annual_income": "75000",
                    "document_date": "2024-12-31",
                    "employee_name": "Extracted from document"
                }
            elif doc_type == "MEDICAL_REPORT":
                extracted_data["extracted_fields"] = {
                    "patient_name": "Extracted from report",
                    "report_date": "2024-10-01",
                    "conditions": "Extracted medical conditions",
                    "doctor_name": "Dr. Extracted"
                }
            elif doc_type == "VEHICLE_REGISTRATION":
                extracted_data["extracted_fields"] = {
                    "vehicle_make": "Toyota",
                    "vehicle_model": "Camry",
                    "vehicle_year": "2020",
                    "registration_number": "ABC123",
                    "owner_name": "Extracted from document"
                }
            elif doc_type == "PROPERTY_DEED":
                extracted_data["extracted_fields"] = {
                    "property_address": "Extracted property address",
                    "owner_name": "Extracted owner",
                    "property_value": "500000",
                    "property_type": "Residential"
                }
            
            return extracted_data
            
        except Exception as e:
            print(f"Error extracting document info: {str(e)}")
            return {
                "filename": filename,
                "error": str(e),
                "extraction_timestamp": datetime.now().isoformat(),
                "extracted_fields": {},
                "document_type": "UNKNOWN",
                "confidence_score": 0.0
            }
    
    @staticmethod
    def _classify_document(filename: str, content_type: str) -> str:
        """
        Classify document type based on filename and content
        
        Returns:
            Document type classification
        """
        filename_lower = filename.lower()
        
        # Simple keyword-based classification
        if any(word in filename_lower for word in ['id', 'license', 'passport', 'identity']):
            return "ID_PROOF"
        elif any(word in filename_lower for word in ['salary', 'income', 'payslip', 'tax', 'w2', '1099']):
            return "INCOME_PROOF"
        elif any(word in filename_lower for word in ['medical', 'health', 'doctor', 'report', 'prescription']):
            return "MEDICAL_REPORT"
        elif any(word in filename_lower for word in ['vehicle', 'registration', 'insurance', 'dmv']):
            return "VEHICLE_REGISTRATION"
        elif any(word in filename_lower for word in ['property', 'deed', 'title', 'real estate']):
            return "PROPERTY_DEED"
        else:
            return "GENERAL_DOCUMENT"
    
    @staticmethod
    def cross_check_information(application_data: Dict[str, Any], extracted_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cross-check extracted information with application form data
        
        Args:
            application_data: Data from application form
            extracted_info: Information extracted from documents
            
        Returns:
            Verification results with matches and mismatches
        """
        verification_results = {
            "verification_timestamp": datetime.now().isoformat(),
            "overall_status": "verified",
            "matches": [],
            "mismatches": [],
            "warnings": [],
            "confidence_score": 0.0
        }
        
        extracted_fields = extracted_info.get("extracted_fields", {})
        doc_type = extracted_info.get("document_type", "UNKNOWN")
        
        # Cross-check based on document type
        if doc_type == "ID_PROOF":
            # Check name
            if "fullName" in application_data and "full_name" in extracted_fields:
                app_name = application_data["fullName"].lower().strip()
                doc_name = extracted_fields["full_name"].lower().strip()
                
                if DocumentVerificationService._names_match(app_name, doc_name):
                    verification_results["matches"].append({
                        "field": "Full Name",
                        "application_value": application_data["fullName"],
                        "document_value": extracted_fields["full_name"],
                        "status": "match"
                    })
                else:
                    verification_results["mismatches"].append({
                        "field": "Full Name",
                        "application_value": application_data["fullName"],
                        "document_value": extracted_fields["full_name"],
                        "severity": "high",
                        "message": "Name on ID doesn't match application"
                    })
                    verification_results["overall_status"] = "needs_review"
            
            # Check date of birth
            if "dateOfBirth" in application_data and "date_of_birth" in extracted_fields:
                if application_data["dateOfBirth"] == extracted_fields["date_of_birth"]:
                    verification_results["matches"].append({
                        "field": "Date of Birth",
                        "application_value": application_data["dateOfBirth"],
                        "document_value": extracted_fields["date_of_birth"],
                        "status": "match"
                    })
                else:
                    verification_results["mismatches"].append({
                        "field": "Date of Birth",
                        "application_value": application_data["dateOfBirth"],
                        "document_value": extracted_fields["date_of_birth"],
                        "severity": "high",
                        "message": "DOB mismatch between application and ID"
                    })
                    verification_results["overall_status"] = "needs_review"
        
        elif doc_type == "INCOME_PROOF":
            # Check income
            if "annualIncome" in application_data and "annual_income" in extracted_fields:
                app_income = float(application_data["annualIncome"])
                doc_income = float(extracted_fields["annual_income"])
                
                # Allow 10% variance
                if abs(app_income - doc_income) / app_income <= 0.1:
                    verification_results["matches"].append({
                        "field": "Annual Income",
                        "application_value": f"${app_income:,.2f}",
                        "document_value": f"${doc_income:,.2f}",
                        "status": "match"
                    })
                else:
                    verification_results["mismatches"].append({
                        "field": "Annual Income",
                        "application_value": f"${app_income:,.2f}",
                        "document_value": f"${doc_income:,.2f}",
                        "severity": "medium",
                        "message": "Income declared doesn't match proof document"
                    })
                    verification_results["overall_status"] = "needs_review"
        
        elif doc_type == "VEHICLE_REGISTRATION":
            # Check vehicle details
            checks = [
                ("vehicleMake", "vehicle_make", "Vehicle Make"),
                ("vehicleModel", "vehicle_model", "Vehicle Model"),
                ("vehicleYear", "vehicle_year", "Vehicle Year")
            ]
            
            for app_field, doc_field, display_name in checks:
                if app_field in application_data and doc_field in extracted_fields:
                    if str(application_data[app_field]).lower() == str(extracted_fields[doc_field]).lower():
                        verification_results["matches"].append({
                            "field": display_name,
                            "application_value": application_data[app_field],
                            "document_value": extracted_fields[doc_field],
                            "status": "match"
                        })
                    else:
                        verification_results["mismatches"].append({
                            "field": display_name,
                            "application_value": application_data[app_field],
                            "document_value": extracted_fields[doc_field],
                            "severity": "high",
                            "message": f"{display_name} mismatch"
                        })
                        verification_results["overall_status"] = "needs_review"
        
        # Calculate confidence score
        total_checks = len(verification_results["matches"]) + len(verification_results["mismatches"])
        if total_checks > 0:
            verification_results["confidence_score"] = len(verification_results["matches"]) / total_checks
        else:
            verification_results["confidence_score"] = 0.5
            verification_results["warnings"].append("No verifiable fields found in document")
        
        return verification_results
    
    @staticmethod
    def _names_match(name1: str, name2: str) -> bool:
        """Simple name matching logic"""
        # Remove common prefixes/suffixes and extra spaces
        name1_parts = set(name1.replace(",", "").split())
        name2_parts = set(name2.replace(",", "").split())
        
        # Check if there's significant overlap
        common = name1_parts.intersection(name2_parts)
        return len(common) >= min(len(name1_parts), len(name2_parts)) * 0.7
    
    @staticmethod
    def generate_verification_summary(verification_results: Dict[str, Any]) -> str:
        """Generate human-readable verification summary"""
        status = verification_results["overall_status"]
        matches = len(verification_results["matches"])
        mismatches = len(verification_results["mismatches"])
        confidence = verification_results["confidence_score"]
        
        summary = f"Verification Status: {status.upper()}\n"
        summary += f"Confidence Score: {confidence:.1%}\n"
        summary += f"Matches: {matches} | Mismatches: {mismatches}\n\n"
        
        if mismatches > 0:
            summary += "⚠️ Issues Found:\n"
            for mismatch in verification_results["mismatches"]:
                summary += f"  • {mismatch['field']}: {mismatch['message']}\n"
                summary += f"    Application: {mismatch['application_value']}\n"
                summary += f"    Document: {mismatch['document_value']}\n"
        
        if matches > 0:
            summary += "\n✅ Verified Fields:\n"
            for match in verification_results["matches"]:
                summary += f"  • {match['field']}: {match['application_value']}\n"
        
        return summary

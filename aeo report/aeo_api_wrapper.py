#!/usr/bin/env python3
"""
AEO API Wrapper
A wrapper script to handle API calls from Next.js to the AEO report generation system.
"""

import sys
import json
import argparse
import subprocess
import os
from pathlib import Path

def run_aeo_report(customer_name, input_data=None):
    """Run the AEO_Prompt_Report.py script with optional input data."""
    try:
        script_path = Path(__file__).parent / "AEO_Prompt_Report.py"
        
        # Run the script
        process = subprocess.Popen(
            [sys.executable, str(script_path), customer_name],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(script_path.parent)
        )
        
        # Send input data if provided
        if input_data:
            stdout, stderr = process.communicate(input=input_data)
        else:
            stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            return {"success": True, "html": stdout, "error": None}
        else:
            return {"success": False, "html": None, "error": stderr}
            
    except Exception as e:
        return {"success": False, "html": None, "error": str(e)}

def run_basic_report(customer_name):
    """Run the Seo_basic_Report.py script."""
    try:
        script_path = Path(__file__).parent / "Seo_basic_Report.py"
        
        process = subprocess.Popen(
            [sys.executable, str(script_path), customer_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(script_path.parent)
        )
        
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            return {"success": True, "html": stdout, "error": None}
        else:
            return {"success": False, "html": None, "error": stderr}
            
    except Exception as e:
        return {"success": False, "html": None, "error": str(e)}

def run_extended_audit(customer_name, url, domain_regex=None):
    """Run the seo_audit_extd.py script."""
    try:
        script_path = Path(__file__).parent / "seo_audit_extd.py"
        
        args = [sys.executable, str(script_path), customer_name, url]
        if domain_regex:
            args.extend(["--domain_regex", domain_regex])
        
        process = subprocess.Popen(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(script_path.parent)
        )
        
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            # For extended audit, we need to read the generated HTML report
            date_str = subprocess.check_output([
                sys.executable, "-c", 
                "from datetime import datetime; print(datetime.now().strftime('%Y-%m-%d'))"
            ], text=True).strip()
            
            base_dir = Path(f"./output/logs/{date_str}/{customer_name.capitalize()}/aeo")
            candidates = [
                base_dir / f"{customer_name.capitalize()}_report.html",
                base_dir / f"{customer_name.capitalize()}_aeo_dashboard.html",
                base_dir / f"{customer_name}_report.html",
                base_dir / f"{customer_name}_aeo_dashboard.html",
            ]
            for report_path in candidates:
                if report_path.exists():
                    html_content = report_path.read_text(encoding='utf-8')
                    return {"success": True, "html": html_content, "error": None}
            return {"success": False, "html": None, "error": f"Report file not found after generation in {base_dir}. Stdout: {stdout[:400]} Stderr: {stderr[:400]}"}
        else:
            return {"success": False, "html": None, "error": stderr}
            
    except Exception as e:
        return {"success": False, "html": None, "error": str(e)}

def run_schema_report(customer_name, input_data=None):
    """Run the Schema_Prompt_Report.py script."""
    try:
        script_path = Path(__file__).parent / "Schema_Prompt_Report.py"
        
        process = subprocess.Popen(
            [sys.executable, str(script_path), customer_name],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(script_path.parent)
        )
        
        if input_data:
            stdout, stderr = process.communicate(input=input_data)
        else:
            stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            return {"success": True, "html": stdout, "error": None}
        else:
            return {"success": False, "html": None, "error": stderr}
            
    except Exception as e:
        return {"success": False, "html": None, "error": str(e)}

def main():
    parser = argparse.ArgumentParser(description="AEO API Wrapper")
    parser.add_argument("report_type", choices=["aeo", "basic", "extended", "schema"], 
                       help="Type of report to generate")
    parser.add_argument("customer_name", help="Customer name")
    parser.add_argument("--url", help="Website URL (required for extended reports)")
    parser.add_argument("--domain_regex", help="Domain regex for extended reports")
    parser.add_argument("--input_data", help="JSON input data for reports that require it")
    
    args = parser.parse_args()
    
    result = None
    
    if args.report_type == "aeo":
        result = run_aeo_report(args.customer_name, args.input_data)
    elif args.report_type == "basic":
        result = run_basic_report(args.customer_name)
    elif args.report_type == "extended":
        if not args.url:
            result = {"success": False, "html": None, "error": "URL is required for extended reports"}
        else:
            result = run_extended_audit(args.customer_name, args.url, args.domain_regex)
    elif args.report_type == "schema":
        result = run_schema_report(args.customer_name, args.input_data)
    
    # Output result as JSON
    print(json.dumps(result))

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
SDGE 2025 Residential Tariff Downloader

This script downloads all current (2025) SDGE residential tariff schedules
from their website and organizes them into folders by category.
"""

import re
import time
from pathlib import Path

import requests


def create_directories():
    """Create organized directory structure for tariffs"""
    base_dir = Path("SDGE_2025_Residential_Tariffs")
    directories = [
        "Standard_Residential",
        "Time_of_Use",
        "Electric_Vehicle",
        "CARE_Programs",
        "Medical_Baseline",
        "Summary_Tables",
    ]

    for directory in directories:
        (base_dir / directory).mkdir(parents=True, exist_ok=True)

    return base_dir


def sanitize_filename(filename):
    """Clean filename for safe file saving"""
    # Remove/replace problematic characters
    filename = re.sub(r'[<>:"/\\|?*]', "_", filename)
    filename = re.sub(r"\s+", "_", filename)  # Replace spaces with underscores
    return filename.strip("_")


def download_file(url, filepath):
    """Download a file from URL to filepath"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        with open(filepath, "wb") as f:
            f.write(response.content)

        print(f"✓ Downloaded: {filepath.name}")
        return True

    except Exception as e:
        print(f"✗ Failed to download {url}: {str(e)}")
        return False


def main():
    """Main function to download all 2025 SDGE residential tariffs"""

    print("🏠 SDGE 2025 Residential Tariff Downloader")
    print("=" * 50)

    # Create directory structure
    base_dir = create_directories()
    print(f"📁 Created directory: {base_dir}")

    # Current 2025 tariff URLs (as of February 2025)
    tariffs = {
        # Standard Residential Services
        "Standard_Residential": [
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20DR%20Total%20Rates%20Table.pdf",
                "Schedule_DR_Standard_Residential.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20DR-LI%20Total%20Rates%20Table.pdf",
                "Schedule_DR-LI_Low_Income.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20DR-MB%20Total%20Rates%20Table.pdf",
                "Schedule_DR-MB_Medical_Baseline.pdf",
            ),
        ],
        # Time of Use Plans
        "Time_of_Use": [
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-DR.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR-P%20Total%20Rates%20Table_0.pdf",
                "Schedule_TOU-DR-P.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR1%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-DR1.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR2%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-DR2.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-ELEC%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-ELEC.pdf",
            ),
        ],
        # Electric Vehicle Plans
        "Electric_Vehicle": [
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20EV-TOU%20%26%20EV-TOU-2%20Total%20Rates%20Tables.pdf",
                "Schedule_EV-TOU_and_EV-TOU-2.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20EV-TOU-5%20Total%20Rates%20Table.pdf",
                "Schedule_EV-TOU-5.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20EV-TOU-5-P%20Total%20Rates%20Table.pdf",
                "Schedule_EV-TOU-5-P.pdf",
            ),
        ],
        # CARE Programs (Low Income)
        "CARE_Programs": [
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR-CARE%20Total%20Rates%20Table_0.pdf",
                "Schedule_TOU-DR-CARE.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR-P-CARE%20Total%20Rates%20Table_0.pdf",
                "Schedule_TOU-DR-P-CARE.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR1-CARE%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-DR1-CARE.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR2-CARE%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-DR2-CARE.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-ELEC-CARE%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-ELEC-CARE.pdf",
            ),
        ],
        # Medical Baseline Programs
        "Medical_Baseline": [
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR-MB%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-DR-MB.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR-P-MB%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-DR-P-MB.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR1-MB%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-DR1-MB.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR2-MB%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-DR2-MB.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-ELEC-MB%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-ELEC-MB.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR-CARE_MB%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-DR-CARE-MB.pdf",
            ),
            (
                "https://www.sdge.com/sites/default/files/regulatory/2-1-25%20Schedule%20TOU-DR-P-CARE_MB%20Total%20Rates%20Table.pdf",
                "Schedule_TOU-DR-P-CARE-MB.pdf",
            ),
        ],
        # Summary Tables
        "Summary_Tables": [
            (
                "https://www.sdge.com/sites/default/files/regulatory/Monthly%20Rates_2025%20-%20Feb.xlsx",
                "Monthly_Rates_2025_February.xlsx",
            ),
        ],
    }

    # Download all tariffs
    total_files = sum(len(files) for files in tariffs.values())
    downloaded_count = 0
    failed_count = 0

    print(f"\n📥 Starting download of {total_files} tariff documents...")
    print("-" * 50)

    for category, file_list in tariffs.items():
        print(f"\n📂 {category.replace('_', ' ')}")
        category_dir = base_dir / category

        for url, filename in file_list:
            filepath = category_dir / sanitize_filename(filename)

            if download_file(url, filepath):
                downloaded_count += 1
            else:
                failed_count += 1

            # Be respectful to the server
            time.sleep(1)

    # Print summary
    print("\n" + "=" * 50)
    print("📊 DOWNLOAD SUMMARY")
    print("=" * 50)
    print(f"✅ Successfully downloaded: {downloaded_count}")
    print(f"❌ Failed downloads: {failed_count}")
    print(f"📁 Files saved to: {base_dir.absolute()}")

    if downloaded_count > 0:
        print(
            f"\n🎉 Download complete! Check the '{base_dir}' folder for your tariff files."
        )
        print("\n📋 Folder structure:")
        for category in tariffs.keys():
            print(f"   • {category.replace('_', ' ')}")

    # Create a README file
    readme_path = base_dir / "README.txt"
    with open(readme_path, "w") as f:
        f.write("SDGE 2025 Residential Tariff Collection\n")
        f.write("=" * 40 + "\n\n")
        f.write("Downloaded on: " + time.strftime("%Y-%m-%d %H:%M:%S") + "\n")
        f.write("Source: San Diego Gas & Electric (SDGE)\n")
        f.write("URL: https://www.sdge.com/total-electric-rates\n\n")
        f.write("Folder Structure:\n")
        for category in tariffs.keys():
            f.write(f"• {category.replace('_', ' ')}\n")
        f.write(f"\nTotal files: {downloaded_count}\n")
        f.write(
            "\nNote: These are the current residential tariff schedules as of February 2025.\n"
        )
        f.write(
            "Rates may change frequently. Check SDGE website for the most current versions.\n"
        )

    print(f"📄 Created README file: {readme_path}")


if __name__ == "__main__":
    main()

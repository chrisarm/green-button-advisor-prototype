# Green Button Advisor

## Take Control of Your Electricity Costs

### Overview

**Green Button Advisor** is a tool that analyzes your electricity usage data to recommend the most cost-effective rate plan for your household. By leveraging your actual consumption patterns, it provides personalized insights that can lead to significant savings.

**Currently optimized for San Diego Gas & Electric customers**, our prototype compares the DR-TOU-1 standard residential plan against the EV-TOU-5 electric vehicle plan. Beta testers have discovered potential savings of **up to $480 annually** simply by switching to the optimal plan for their usage patterns.

### The Problem

Most consumers struggle to decipher which electricity plan truly saves them money. Time-of-use rates, demand charges, and special EV plans create a confusing landscape where the wrong choice could cost hundreds of dollars annually.

### Features

- **Personalized Rate Analysis**: Compare multiple rate plans using your actual usage data
- **Local Processing**: All calculations performed in your browser for maximum privacy
- **Visual Comparisons**: Clear side-by-side cost breakdowns
- **Actionable Recommendations**: Specific guidance on which plan will save you money

## How It Works

Green Button Advisor leverages the Green Button Data standard—an industry initiative that gives consumers access to their energy usage information.

1. **Access Your Data**: Log into your SDGE online account
2. **Download Usage Data**: Export your hourly electricity consumption as Green Button CSV files
3. **Upload to Our Tool**: Drag and drop your files into our secure analyzer
4. **Review Personalized Analysis**: Receive a comparison showing exactly how much you would pay under each plan
5. **Make an Informed Choice**: Switch to the recommended plan and start saving

## Usage Instructions

### Accessing Your Green Button Data

#### Step 1: Access Your SDGE Account

- Navigate to SDGE.com and click "Log In" in the top right corner
- Enter your username and password to access your account dashboard

#### Step 2: Download Your Green Button Data

- From your dashboard, select "Energy Usage"
- Look for the "Green Button" option (typically under "Download My Data")
- Select "Download My Data" (not "Connect My Data")
- Choose the hourly interval option
- Select a date range of at least 3 months for the most accurate analysis
- Click "Download" to save your CSV file to your computer

#### Step 3: Upload Data to Green Button Advisor

- Navigate to the Green Button Advisor prototype
- Click the upload area or drag your CSV file directly into the designated zone
- Wait for the analysis to complete (typically less than 30 seconds)

## Troubleshooting

- **File Format Issues?** Ensure you've selected the CSV format, not XML
- **Data Too Limited?** For best results, upload at least 3 months of usage data
- **Processing Errors?** Try downloading a fresh copy of your data

## Privacy

**Your privacy matters**: Your energy data never leaves your device. All analysis happens locally in your browser—we never store or transmit your personal usage information.

## License

```
© 2025 Green Button Advisor. All rights reserved.

Source-Available License

The source code for this project is publicly available for viewing only to allow for community support to make it better. You should only copy or fork this code if you intend to help in the development and maintenance of this project.

All commercial usage of this code is prohibitted without explicit written permission from the author of this code.

Any use, modification, distribution, or implementation of this software or portions of it
requires explicit written permission from the copyright holder.

To request permission, please apply to be a contributor.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

## Contributing

Contributions to Green Button Advisor are welcome for review, though deployment of modifications is subject to the license terms above. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

Contributions will be reviewed and considered, but remain subject to the source-available license terms.

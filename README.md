# GAS2GitHub2GAS


This script has 3 functions:

- Write a Google Apps Script file to a GitHub folder.
- Update a Google Apps Script file back from  the GitHub folder (filenames as key).
- Update a Google Apps Script file from another Google Apps Script file (filenames as key).

## This is a Proof of Concept. It needs a UI, or be integrated in an Addon.

## Libraries used:
EzyOauth2 library, Bruce McPherson. This is to access the Drive API to import scripts. Not needed to update TO GitHub.

MSaYlTXSVk7FAqpHNCcqBv6i_d-phDA33

http://ramblings.mcpher.com/Home/excelquirks/oauthtoo/ezyoauth2

## Notes

The 'keepFileNames' argument is an array with filenames to skip when updating.
I.e. a configuration file you don't want to update.

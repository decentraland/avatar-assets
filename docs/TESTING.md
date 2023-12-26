# Testing

This document explains how to use the links for testing purposes provided in the pull request. It aims to test the updated collections in a lower environment before deploying them to production.

## Pull-request Integration

Whenever a new pull request is opened in this repository, an automated job is triggered to detect any changes in the assets. If the script identifies that an asset has been updated, it automatically creates a comment in the pull request with the following information:

* **Updated Assets Section**: Lists all assets that have been updated in that pull request.
* **Link for Testing Purposes Section**: Provides one or several links to test the updated collections in a lower environment (`zone`).
* **Validation Errors**: Lists any failures detected in the updated assets, if any.

This document explains how to use the links listed under the `Link for Testing Purposes` section.

## Testing Assets

### Step 1: Accessing the Test Environment
Access the link provided in the `Link for Testing Purposes` section in the pull request's comment.

### Step 2: Setting Up the Browser Console
* **Open the Browser Console**: Once the Decentraland page is loaded, open your browser's console. This is usually done by right-clicking on the webpage and selecting `Inspect` or `Inspect Element`, then navigating to the `Sources` tab.

* **Set a Breakpoint in the Console**: While on the `Sources` tab, press `COMMAND` + `P` (if on Mac) or `CTRL` + `P` (if on Windows) and search for the file `browser-interface/packages/config/index.ts`. Then, go to line 12/13 (`export const PREVIEW: boolean = !!(globalThis as any).preview`) and place a breakpoint on that line by clicking the line number to the left of the text.

* **Reload the Page**: After setting the breakpoint, reload the Decentraland page.

### Step 3: Activating Preview Mode
* **Activate Preview Mode**: When the page execution stops at the breakpoint you set earlier, execute the following command in the console: `globalThis.preview = true`. This enables the preview mode. To do this, switch to the `Console` tab and paste the line mentioned above.

* **Trust the Domain**: If prompted, trust the domain to allow the preview mode to function correctly.

### Step 4: Viewing the Items
* **Check the Backpack**: After completing the above steps, you should be able to see the items in your backpack in Decentraland. This indicates that the wearable items are now visible and ready for testing.

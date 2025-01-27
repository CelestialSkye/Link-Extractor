document.addEventListener("DOMContentLoaded", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    console.error("❌ No active tab found.");
    return;
  }


  chrome.storage.local.get("extractedData", async (result) => {
    if (result.extractedData && result.extractedData.length > 0) {
      console.log("🔄 Loading saved data:", result.extractedData);
      displayLinks(result.extractedData);
    } else {
      // If no data is stored, extract links
      extractAndStoreLinks(tab.id);
    }
  });
});


document.getElementById("load-links").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    console.error("❌ No active tab found.");
    return;
  }
  extractAndStoreLinks(tab.id);  // Re-trigger the link extraction
});

// Search function
const searchInput = document.getElementById("search-input");
searchInput.addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase();
  filterLinks(query);
});


function extractAndStoreLinks(tabId) {
  try {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        function: extractLinks,
      },
      async (results) => {
        if (chrome.runtime.lastError) {
          console.error("🔥 ExecuteScript Error:", chrome.runtime.lastError.message);
          return;
        }

        if (!results || !results[0] || !results[0].result) {
          console.error("⚠️ No results returned from script execution.");
          return;
        }

        const links = results[0].result;
        console.log("🔗 Extracted Links:", links);

        const uniqueLinks = Array.from(new Set(links)); // Remove duplicates

        chrome.storage.local.set({ extractedData: uniqueLinks }, () => {
          console.log("✅ Links saved in storage.");
        });

        displayLinks(uniqueLinks);
      }
    );
  } catch (error) {
    console.error("🔥 Error in popup.js:", error);
  }
}


function extractLinks() {
  return Array.from(document.querySelectorAll("a"))
    .map((a) => a.href)
    .filter((href) => href.trim() !== "");
}


function displayLinks(links) {
  const list = document.getElementById("link-list");
  const countElement = document.getElementById("link-count");

  if (!list) {
    console.error("❌ Element with ID 'link-list' not found in DOM.");
    return;
  }

  list.innerHTML = ""; // Clear existing items

  // Display the count
  if (countElement) {
    countElement.textContent = `Total Links: ${links.length}`;
  }

  links.forEach((link) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = link;
    a.textContent = link;
    a.target = "_blank";
    li.appendChild(a);
    list.appendChild(li);
  });
}


function filterLinks(query) {
  chrome.storage.local.get("extractedData", (result) => {
    const links = result.extractedData || [];

 
    const filteredLinks = links.filter((link) => {
      return link.toLowerCase().includes(query); 
    });

    
    displayLinks(filteredLinks);
  });
}

// Function to clear storage
document.getElementById("clear-storage").addEventListener("click", () => {
  chrome.storage.local.remove("extractedData", () => {
    console.log("🗑️ Storage cleared.");

    document.getElementById("link-list").innerHTML = "";
    const countElement = document.getElementById("link-count");

    if (countElement) {
      countElement.textContent = "Total Links: 0";
    }
  });
});




import { createNestablePublicClientApplication } from "@azure/msal-browser";

const CLIENT_ID = "72c1b54e-796b-4e6b-aa89-1f85502cc6b9";
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
let msalInstance = null;

async function initMsal() {
  if (msalInstance) return msalInstance;
  msalInstance = await createNestablePublicClientApplication({
    auth: { clientId: CLIENT_ID, authority: "https://login.microsoftonline.com/common" },
    cache: { cacheLocation: "localStorage" },
  });
  return msalInstance;
}

async function getToken(scopes) {
  const msal = await initMsal();
  try {
    const res = await msal.acquireTokenSilent({ scopes });
    return res.accessToken;
  } catch (e) {
    const res = await msal.acquireTokenPopup({ scopes });
    return res.accessToken;
  }
}

async function graphFetch(url, options) {
  const token = await getToken(["Mail.ReadWrite"]);
  const res = await fetch(GRAPH_BASE + url, {
    ...options,
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", ...(options && options.headers) },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Graph " + res.status + ": " + err);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Convert Office.js EWS item ID to a Graph-compatible immutable ID
// Office desktop Outlook uses EWS-format IDs; Graph API needs REST IDs.
// The translateExchangeIds endpoint handles this conversion.
async function toGraphId(ewsId) {
  const result = await graphFetch("/me/translateExchangeIds", {
    method: "POST",
    body: JSON.stringify({
      inputIds: [ewsId],
      sourceIdType: "ewsId",
      targetIdType: "restId",
    }),
  });
  if (result && result.value && result.value[0]) return result.value[0].targetId;
  throw new Error("Could not translate ID");
}

// Update categories on any message (not just the selected one)
async function graphSetCategories(messageId, categories) {
  const graphId = await toGraphId(messageId);
  return graphFetch("/me/messages/" + graphId, {
    method: "PATCH",
    body: JSON.stringify({ categories }),
  });
}

// Move message to archive folder
async function graphArchiveMessage(messageId) {
  const graphId = await toGraphId(messageId);
  return graphFetch("/me/messages/" + graphId + "/move", {
    method: "POST",
    body: JSON.stringify({ destinationId: "archive" }),
  });
}

// Scan inbox for messages with task categories
async function graphScanCategorizedEmails() {
  const cats = ["High", "Med", "Low", "Discuss", "Waiting", "Delegate"];
  const filter = cats.map(c => "categories/any(a:a eq '" + c + "')").join(" or ");
  const result = await graphFetch(
    "/me/mailFolders/inbox/messages?$filter=" +
      encodeURIComponent(filter) +
      "&$select=id,subject,receivedDateTime,categories,conversationId,from" +
      "&$orderby=receivedDateTime desc&$top=50"
  );
  return result && result.value ? result.value : [];
}

// Expose all Graph functions on window for use by inline script in taskpane.html
window.k92Graph = {
  init: initMsal,
  setCategories: graphSetCategories,
  archiveMessage: graphArchiveMessage,
  scanCategorizedEmails: graphScanCategorizedEmails,
};

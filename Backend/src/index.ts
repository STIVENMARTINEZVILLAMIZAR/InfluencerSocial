import { loadLocalSecrets } from './loadLocalSecrets';

loadLocalSecrets();

import { initializeApp } from "firebase-admin/app";

initializeApp();

export { generateContent } from "./ai/generateContent";
export { generateVideo } from "./ai/generateVideo";
export { chatWithAgent } from "./ai/chatWithAgent";
export { schedulePost } from "./posts/schedulePost";
export { publishPostNow } from "./posts/publishPostCallable";
export { uploadPublicationImage } from "./posts/uploadPublicationImage";
export { scheduledPublisher } from "./posts/scheduledPublisher";
export { processDueScheduledPosts } from "./posts/processDueScheduledPosts";
export { triggerMakeWorkflow } from "./integracion/triggerMakeWorkflow";
/** @deprecated usar triggerMakeWorkflow */
export { triggerN8nWorkflow } from "./integracion/triggerN8nWorkflow";
export { verifyChannelConnection } from "./integracion/verifyChannelConnection";
export { startLinkedInOAuth } from "./integracion/startLinkedInOAuth";
export { completeLinkedInOAuth } from "./integracion/completeLinkedInOAuth";
export { startMetaOAuth } from "./integracion/startMetaOAuth";
export { completeMetaOAuth } from "./integracion/completeMetaOAuth";
export { startTikTokOAuth } from "./integracion/startTikTokOAuth";
export { completeTikTokOAuth } from "./integracion/completeTikTokOAuth";
export { onAuthUserCreate } from "./auth/onUserCreate";
export { healthCheck } from "./ai/healthCheck";
export { linkedinOAuthStart, linkedinOAuthCallback } from "./oauth/linkedinOAuth";

'use client';

import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
export default function WatchPage() {
    return (
      <Suspense fallback={<p>Loading...</p>}>
        <Watch />
      </Suspense>
    );
}
function Watch() {
    const videoPrefix = "https://storage.cloud.google.com/yt-clone-processed-bucket/";
    const videoSrc = useSearchParams().get('v');
    
    return (
        <div>
            <h1>Watch Page</h1>
            <video controls src={videoPrefix + videoSrc}></video>
        </div>
    );
}
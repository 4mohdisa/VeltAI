// Uploads Lume's fixed retention messages to Apple's Retention Messaging API
// (sandbox). Does nothing unless RETENTION_MESSAGING_ENABLED is on.
//
//	RETENTION_MESSAGING_ENABLED=true APPLE_IAP_KEY_ID=... APPLE_IAP_ISSUER_ID=... \
//	  APPLE_BUNDLE_ID=... APPLE_IAP_PRIVATE_KEY="$(cat AuthKey.p8)" go run ./tools/retention
package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"lume/backend/internal/config"
	"lume/backend/internal/retention"
)

func main() {
	if !retention.Enabled() {
		fmt.Println("retention:", retention.FlagEnv, "is off, nothing sent")
		return
	}
	c := retention.NewAppleClient(retention.AppleSandboxBaseURL, retention.AppleToken(
		config.Env("APPLE_IAP_KEY_ID", ""), config.Env("APPLE_IAP_ISSUER_ID", ""),
		config.Env("APPLE_BUNDLE_ID", ""), config.Env("APPLE_IAP_PRIVATE_KEY", "")))
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()
	for key, m := range retention.Messages {
		if err := c.Upload(ctx, m); err != nil {
			fmt.Fprintln(os.Stderr, "retention:", key, err)
			os.Exit(1)
		}
		fmt.Println("retention: uploaded", key)
	}
}

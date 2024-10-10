# DEMO UI

## Run on dev board

The system webview in dev board(Thundercoom W5+) is not compatible with Webassembly. So we need to uninstall the system webview and install a compatible webview.

### Uninstall system webview

```shell
# https://chromium.googlesource.com/chromium/src/+/HEAD/android_webview/docs/removing-system-apps.md

# Figure out the path of the system app. This varies depending on OS level.
$adb adb shell pm path com.android.webview
# package:/system/app/WebViewGoogle/WebViewGoogle.apk
$adb root

# This is necessary for M and up:
$ adb disable-verity
$ adb reboot
# wait for device to reboot...
$ adb root

# For all OS versions:
# Mount the system partition as read-write and 'rm' the path we found before.
$ adb remount
$ adb shell stop
$ adb shell rm -rf /system/app/WebViewGoogle/WebViewGoogle.apk
$ adb shell start
```

### Install compatible webview

Download the apk from [here](https://www.apkmirror.com/apk/bromite/bromite-system-webview/bromite-system-webview-106-0-5249-72-release/bromite-system-webview-106-0-5249-72-3-android-apk-download/#google_vignette)

```shell
$adb install com.android.webview_106.0.5249.72-1664390640_minAPI23(armeabi-v7a)(nodpi)_apkmirror.com.apk

# Check if the webview is installed
$adb shell am start -a "com.android.webview.SHOW_DEV_UI"
```

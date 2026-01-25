#!/usr/bin/osascript

# 通过浏览器自动打开并检查前端页面 10 次

property browser_url : "http://localhost:5173/"
property test_count : 10
property wait_time : 2

on run
    set success_count to 0
    set fail_count to 0

    tell application "System Events"
        set is_chrome to (name of processes) contains "Google Chrome"
        set is_safari to (name of processes) contains "Safari"
    end tell

    if is_chrome then
        set browser_name to "Google Chrome"
    else if is_safari then
        set browser_name to "Safari"
    else
        display dialog "未找到浏览器（Chrome 或 Safari）" buttons {"OK"} default button "OK"
        return
    end if

    repeat with i from 1 to test_count
        set test_time to (current date) as string

        tell application browser_name
            activate
            open location browser_url
        end tell

        delay 3

        if i < test_count then
            tell application "System Events"
                keystroke "w" using {command down}
            end tell
            delay wait_time
        end if

        set success_count to success_count + 1
        log "Test " & i & " completed at " & test_time
    end repeat

    return success_count & " tests completed successfully"
end run

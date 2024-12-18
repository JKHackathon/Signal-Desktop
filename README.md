# Signal Desktop with Deniable Encryption

Put purpose here

## Build

1. Clone the libsignal library

2. Modify the `package.json` libsignal dependency to use your local installation (ex: `"@signalapp/libsignal-client": "file:../libsignal/node"`)

3. Inside the Signal-Desktop directory, run `npm install`
   If you get an error running regarding the Smaz license, this means the package patch did not work. Manually go into the node_modules directory and modify the licenses field `package.json` of the Smaz package from

```
"licenses": [
    {
      "type": "BSD",
      "url": "https://github.com/personalcomputer/smaz.js/blob/master/COPYING"
    }
  ]
```

to

```
"license": "BSD (https://github.com/personalcomputer/smaz.js/blob/master/COPYING)"
```

Then, rerun `npm install` and the error should go away.

4. Build the project using `npm run generate`. If you get an error message that looks like the following, you may ignore it as this is a known issue that does not noticeably affect the client:

```
$ ./node_modules/.bin/electron-builder install-app-deps

  • electron-builder  version=24.6.3
  • loaded configuration  file=package.json ("build" field)
  • rebuilding native dependencies  dependencies=@nodert-win10-rs4/windows.data.xml.dom@0.4.4, @nodert-win10-rs4/windows.ui.notifications@0.4.4, @signalapp/better-sqlite3@8.7.1, @signalapp/windows-dummy-keystroke@1.0.0, bufferutil@4.0.7, fs-xattr@0.3.0, mac-screen-capture-permissions@2.0.0, utf-8-validate@5.0.10
                                    platform=linux
                                    arch=x64
  • install prebuilt binary  name=mac-screen-capture-permissions version=2.0.0 platform=linux arch=x64 napi=
  • build native dependency from sources  name=mac-screen-capture-permissions
                                          version=2.0.0
                                          platform=linux
                                          arch=x64
                                          napi=
                                          reason=prebuild-install failed with error (run with env DEBUG=electron-builder to get more information)
                                          error=/home/ben/sauce/Signal-Desktop/node_modules/node-abi/index.js:30
      throw new Error('Could not detect abi for version ' + target + ' and runtime ' + runtime + '.  Updating "node-abi" might help solve this issue if it is a new release of ' + runtime)
      ^

    Error: Could not detect abi for version 30.0.6 and runtime electron.  Updating "node-abi" might help solve this issue if it is a new release of electron
        at getAbi (/home/ben/sauce/Signal-Desktop/node_modules/node-abi/index.js:30:9)
        at module.exports (/home/ben/sauce/Signal-Desktop/node_modules/prebuild-install/rc.js:53:57)
        at Object.<anonymous> (/home/ben/sauce/Signal-Desktop/node_modules/prebuild-install/bin.js:8:25)
        at Module._compile (node:internal/modules/cjs/loader:1376:14)
        at Module._extensions..js (node:internal/modules/cjs/loader:1435:10)
        at Module.load (node:internal/modules/cjs/loader:1207:32)
        at Module._load (node:internal/modules/cjs/loader:1023:12)
        at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:135:12)
        at node:internal/main/run_main_module:28:49

    Node.js v20.11.1
```

## Additional storage profiles

If you need additional phone numbers, you can use
[Google Voice (one number per Google Account, free SMS)](https://voice.google.com/).

Once you have the additional numbers, you can setup additional storage profiles and switch
between them using the `NODE_APP_INSTANCE` environment variable.

For example, to create an 'alice' profile, put a file called `local-alice.json` in the
`/config` subdirectory of your project checkout where you'll find other `.json` config files:

```
{
  "storageProfile": "aliceProfile"
}
```

Then you can start up the application a little differently to load the profile:

```
NODE_APP_INSTANCE=alice npm start
```

This changes the `userData` directory from `%appData%/Signal` to `%appData%/Signal-aliceProfile`.

## Running

When first running the project, you will have to set up the client in standalone mode as it is currently using the development servers. After starting the client using `npm start`, use the menu bar to select `File->Set Up as Standalone Device`.

Sending an SMS to the specified phone number will open up a CAPTCHA. If the link fails to redirect to the client, close the warning toast and copy the link embedded in the "Open Signal" message. Then, run `npm start <copied link>` in a separate terminal instance which should redirect to the open client. Do not close the original client otherwise you will have to restart the process! Enter the verification code and select "Register". Finally, quit the client and rerun `npm start`. Congratulations! You have gained access to the Signal Desktop client!

## Sending and Receiving Secret Messages

First, start a 1:1 conversation with the intended recipient. Make sure you have the client open for each profile (the reason why is explained in the Report). Within the conversation, select the 3-dot menu option in the top right and then select `Show Secret Mode`. Then simply enter a secret message in the bottom input box, send it, then follow the prompt to send the specified number of cover messages.

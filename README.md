# Stream Deck Macros

Macros for my Elgato Stream Deck

## Setup

Install `nodejs` and `yarn`.

Install the app's dependencies:

```bash
yarn install
```

### Linux

You will need a udev rule for your user group to access the Stream Deck:

```bash
sudo nano /etc/udev/rules.d/1001-streamdeck.rules
```

Replace the `ATTR` below with the id of your Stream Deck. You can get this by
 running `lsusb` and grabbing the code after the `:` in the output. Also
 replace the user group with your own.

```bash
SUBSYSTEM=="usb", ATTR{idVendor}=="18d1", ATTR{idProduct}=="0060", MODE="0660",
GROUP="yourusergroup"
```

Replug your device

## Usage

```bash
yarn start
```

### Development

```bash
yarn dev
```

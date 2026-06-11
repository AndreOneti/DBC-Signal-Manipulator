# DBC Signal Editor

A web-based editor for CAN database (DBC) signal visualization and manipulation.

## Features

- **Parse DBC files** - Load and parse standard Vector DBC format files
- **Signal editing** - View and modify signal values with real-time encoding
- **Multiplex support** - Full support for multiplexed CAN messages
- **Payload visualization** - Real-time hex display of CAN frame payload
- **Intel/Motorola byte order** - Correct encoding for both byte orders

## Getting Started

```bash
npm install
npm run dev
```

Open your browser and load a DBC file to start editing signals.

## Usage

1. Click the upload area or drag a `.dbc` file
2. Select a message from the sidebar
3. Adjust signal values using the sliders/inputs
4. View the encoded payload in real-time

## DBC Format

Supports standard Vector DBC syntax including:

- Message definitions (`BO_`)
- Signal definitions (`SG_`)
- Multiplexed signals (`M` selector, `m0`, `m1`, etc.)
- Comments (`CM_`)
- Intel/Motorola byte order (`@1` / `@0`)

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

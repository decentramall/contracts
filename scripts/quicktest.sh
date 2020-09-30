#!/usr/bin/env bash

sleep 5 && truffle deploy --network development --reset &
npx ganache-cli --mnemonic "hood return pride refuse resemble connect initial" --gasLimit 0xfffffffffff --networkId 1337 --port 8545



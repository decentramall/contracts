#!/usr/bin/env bash

echo "Starting script..."

output=$(pow ffs create)
token=${output##* token}
token=${token:0:37}

echo "FFS_TOKEN created!"

echo "NEXT_PUBLIC_POWERGATE_URL=http://127.0.0.1:6002
NEXT_PUBLIC_FFS_TOKEN=$token" > '../webui/.env.local'

sleep 5 && truffle deploy --network development --reset &
npx ganache-cli --mnemonic "hood return pride refuse resemble connect initial" --gasLimit 0xfffffffffff --networkId 1337 --port 8545



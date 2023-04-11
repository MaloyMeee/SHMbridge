import { NetworkErrorMessage } from "./NetworkErrorMessage"

export function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <html>
      <header>
	    <title>Buy SHM</title>
      </header>
      <body>
      <div>
        {networkError && (
          <NetworkErrorMessage 
            message={networkError} 
            dismiss={dismiss} 
          />
        )}
      </div>

      <p>Please connect your account...</p>
      <button type="button" onClick={connectWallet}>
        Connect Wallet
      </button>
      </body>
    </html>
  )
}
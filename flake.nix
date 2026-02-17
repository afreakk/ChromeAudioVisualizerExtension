{
  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          devShell = pkgs.mkShell
            {
              buildInputs = [
                pkgs.pnpm
                pkgs.playwright-driver
              ];

              shellHook = ''
                export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
                export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
                export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
              '';
            };
        }
      );
}


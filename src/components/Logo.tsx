import Image from "next/image";

// Size of the files in public/, which are three times the size they are shown at.
const WIDTH = 600;
const HEIGHT = 134;

/**
 * The NextFloor logo, with light lettering when the page is dark. Both copies
 * load lazily, so the browser only fetches the one that is shown.
 */
export function Logo() {
  const shared = { width: WIDTH, height: HEIGHT, sizes: "200px" };
  return (
    <>
      <Image {...shared} src="/logo.png" alt="NextFloor" className="h-11 w-auto dark:hidden" />
      <Image {...shared} src="/logo-dark.png" alt="NextFloor" className="hidden h-11 w-auto dark:block" />
    </>
  );
}

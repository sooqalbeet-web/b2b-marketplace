export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { bootstrap } = await import("./lib/bootstrap");
    await bootstrap();
  } catch (e) {
    console.error("Startup bootstrap failed (tables may not exist yet):", e);
  }
}

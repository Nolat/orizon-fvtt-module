export function log(message: any) {
  console.log("%cOrizon %c| ", "color:#4BC470", "color:#B3B3B3", message);
}

export function warn(message: any) {
  console.warn("Orizon | ", message);
}

export function error(message: any) {
  console.error("Orizon | ", message);
}

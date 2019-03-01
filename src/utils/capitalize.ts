export default function capitalize(str: string) {
  return str.replace(/^\w/, chr => chr.toUpperCase());
}

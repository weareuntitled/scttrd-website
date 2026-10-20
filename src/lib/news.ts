export function newsUrl(item: any): string {
  return `/news/${item?.slug ?? item?.data?.slug ?? ''}/`
}

import { trpc } from "@/lib/server/utils/trpc"

export default function Home() {
  const { data: carList, isLoading } = trpc.setup.carList.useQuery()
  if (isLoading) {
    return <div>Loading...</div>
  }
  return (
    <div>
      <h1>rbr-setups</h1>
      <h2>Available cars to parse:</h2>
      <ul>
        {carList?.map((car) => (
          <li key={car}>{car}</li>
        ))}
      </ul>
    </div>
  )
}

import SetupContainer from "@/components/setup_container"
import { Setup } from "@/lib/lsp/scanner"
import { trpc } from "@/lib/server/utils/trpc"
import { ChangeEvent, useRef, useState } from "react"

export default function Home() {
  const [currSetup, setCurrSetup] = useState<Setup>({})
  const carsContainerRef = useRef<HTMLDivElement | null>(null)

  const setup = trpc.setup.load.useMutation()
  const { data: carList, isLoading } = trpc.setup.carList.useQuery()
  if (isLoading) {
    return <div>Loading...</div>
  }

  const onLoadSetupFile = (evt: ChangeEvent<HTMLInputElement>): void => {
    evt.preventDefault()

    const carName = checkedCar()
    if (carName.length === 0) {
      console.error("Select one of the checkbox to be able to load the setup")
      evt.target.value = ""
      return
    }

    const file = evt.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.name.endsWith(".lsp")) {
      console.error("Only .lsp files are allowed")
      evt.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const buf = (e.target?.result)
      if (buf instanceof ArrayBuffer) {
        if (buf.byteLength > 48 * 1024) {
          console.error("File must be <= 48KB")
          return
        }
        try {
          const setupRes = await setup.mutateAsync({ name: carName, type: "r_tarmac", buf: Array.from(new Uint8Array(buf)) })
          setCurrSetup(setupRes)
        } catch (error) {
          console.error(error)
        }
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const checkedCar = (): string => {
    if (!carsContainerRef.current) return ""
    const checkboxes = carsContainerRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    for (const checkbox of checkboxes) {
      if (checkbox.checked) {
        return checkbox.value
      }
    }
    return ""
  }

  const onChangeCheckbox = (evt: ChangeEvent<HTMLInputElement>): void => {
    const checked = evt.target.checked
    if (!checked || !carsContainerRef.current) return

    const checkboxes = carsContainerRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    checkboxes.forEach((checkbox) => {
      if (checkbox !== evt.target) {
        checkbox.checked = false
      }
    })
  }

  return (
    <div className="m-4">
      <h1 className="mb-4">rbr-setups</h1>
      <h2 className="m-0 font-bold">Available cars that ready for setup updates:</h2>
      <small>Select which car setup you want to change</small>
      <div ref={carsContainerRef} className="flex flex-col mt-2">
        {carList?.map((car) => (
          <label key={car}>
            <input onChange={onChangeCheckbox} type="checkbox" value={car} />
            <span className="ml-2">{car}</span>
          </label>
        ))}
      </div>
      <br />
      <div>
        <span style={{ marginRight: "8px" }}>Upload your setup file:</span>
        <input accept=".lsp" type="file" onChange={onLoadSetupFile} />
      </div>
      <br />
      <SetupContainer setup={currSetup} />
    </div>
  )
}

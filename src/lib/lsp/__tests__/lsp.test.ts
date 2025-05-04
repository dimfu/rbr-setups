import { describe, expect, test } from "vitest";
import LSP from "../lsp";
import { join } from "path";
import { readFile } from "fs/promises";

describe("Lsp Class Tests", () => {
	test("update setup value properly", () => {
		const Lsp = new LSP(`((Car (MaxSteeringLock 0.615)))`, `(("(null)"
  CarOptions
  ("(null)"
   MaxSteeringLockRangeMax			0.620
   MaxSteeringLockRangeMin			0.615
   MaxSteeringLockRangeStep			0.010))`)
		Lsp.parse()
		Lsp.update("Car.MaxSteeringLock", "0.620000")
		expect(Lsp.props.Car.MaxSteeringLock).toBe("0.620000")
	})

	test("should throw on unrecognized setup section", () => {
		const Lsp = new LSP(`((Car (MaxSteeringLock 0.615)))`, "foo")
		Lsp.parse()
		expect(() => Lsp.update("Deez", "0.69")).toThrow("Target must be in 'Section.Key' format")
	})

	test("should throw on unrecognized setup sub section", () => {
		const Lsp = new LSP(`((Car (MaxSteeringLock 0.615)))`, "foo")
		Lsp.parse()
		expect(() => Lsp.update("Deez.Nutz", "0.69")).toThrow("Key 'Deez.Nutz' is not recognized as setup options")
	})

	test("should update multiple setup section correctly", async () => {
		const setupPath = join(process.cwd(), "src/lib/lsp/__tests__/grip.txt")
		const setupSource = await readFile(setupPath, "utf-8")
		const optionsPath = join(process.cwd(), "src/lib/lsp/__tests__/r_tarmac.txt")
		const optionsSource = await readFile(optionsPath, "utf-8")
		const Lsp = new LSP(setupSource, optionsSource)

		Lsp.parse()
		Lsp.update("Car.MaxSteeringLock", "0.617")
		Lsp.update("SpringDamperRF.SpringLength", "0.490")
		Lsp.update("SpringDamperRF.SpringStiffness", "15100")
		Lsp.update("SpringDamperRF.HelperSpringLength", "0.280")

		expect(Lsp.props.Car.MaxSteeringLock).toBe("0.617000")
		expect(Lsp.props.SpringDamperRF.SpringLength).toBe("0.490000")
		expect(Lsp.props.SpringDamperRF.SpringStiffness).toBe("15100.000000")
		expect(Lsp.props.SpringDamperRF.HelperSpringLength).toBe("0.280000")
	})
})

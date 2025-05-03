import { describe, expect, test } from "vitest";
import LSP from "../lsp";
import { join } from "path";
import { readFile } from "fs/promises";

describe("Lsp Class Tests", () => {
	test("update setup value properly", () => {
		const Lsp = new LSP(`((Car (MaxSteeringLock 0.615)))`)
		Lsp.parse()
		Lsp.update("Car.MaxSteeringLock", "0.800")
		expect(Lsp.props.Car.MaxSteeringLock).toBe("0.800")
	})

	test("should throw on unrecognized setup section", () => {
		const Lsp = new LSP(`((Car (MaxSteeringLock 0.615)))`)
		Lsp.parse()
		expect(() => Lsp.update("Deez", "0.69")).toThrow("Target must be in 'Section.Key' format")
	})

	test("should throw on unrecognized setup sub section", () => {
		const Lsp = new LSP(`((Car (MaxSteeringLock 0.615)))`)
		Lsp.parse()
		expect(() => Lsp.update("Deez.Nutz", "0.69")).toThrow("Section 'Deez' not found")
	})

	test("should update multiple setup section correctly", async () => {
		const filepath = join(process.cwd(), "src/lib/lsp/__tests__/grip.lsp")
		const content = await readFile(filepath, "utf-8")
		const Lsp = new LSP(content)
		Lsp.parse()
		// TODO: should the update can be done in batch?
		Lsp.update("Car.MaxSteeringLock", "0.81000")
		Lsp.update("SpringDamperRF.SpringLength", "0.820")
		Lsp.update("SpringDamperRF.SpringStiffness", "0.800")
		Lsp.update("SpringDamperRF.HelperSpringLength", "0.800")

		expect(Lsp.props.Car.MaxSteeringLock).toBe("0.81000")
		expect(Lsp.props.SpringDamperRF.SpringLength).toBe("0.820")
		expect(Lsp.props.SpringDamperRF.SpringStiffness).toBe("0.800")
		expect(Lsp.props.SpringDamperRF.HelperSpringLength).toBe("0.800")
	})
})

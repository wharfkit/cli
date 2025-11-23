import {execSync} from 'child_process'

/**
 * Kill any nodeos processes listening on the specified port
 * @param port - The port number to check
 */
export function killProcessAtPort(port: number): void {
    try {
        const pids = execSync(`lsof -ti:${port} -sTCP:LISTEN`, {encoding: 'utf8'})
            .trim()
            .split('\n')
        for (const pid of pids) {
            if (!pid) continue
            const pidNum = parseInt(pid)
            if (isNaN(pidNum) || pidNum === process.pid || pidNum === process.ppid) continue
            try {
                const cmd = execSync(`ps -p ${pidNum} -o command=`, {encoding: 'utf8'}).trim()
                if (cmd.includes('nodeos')) {
                    execSync(`kill -9 ${pidNum}`, {encoding: 'utf8', stdio: 'ignore'})
                }
            } catch {
                // Process might be gone already
            }
        }
        // Give it a moment to fully shut down
        execSync('sleep 0.5', {encoding: 'utf8', stdio: 'ignore'})
    } catch {
        // Port is free or lsof failed
    }
}

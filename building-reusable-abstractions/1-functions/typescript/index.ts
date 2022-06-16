import * as civo from "@pulumi/civo";

// {
//   "name": "my-network",
//   "firewall": {
//     "ports": [
//       {
//         "label": "my-port",
//         "action": "allow",
//         "protocol": "tcp",
//         "startPort": 80,
//         "endPort": 80,
//         "cidr": "0.0.0.0/0"
//       }
//     ]
//   }
// }

interface NetworkArgs {
  rules: FirewallRule[];
}

interface FirewallRule {
  label: string;
  protocol: string;
  port: string;
  cidr: string;
}

const createNetwork = (name: string, args: NetworkArgs) => {
  const network = new civo.Network(name, {
    label: "pulumi-workshop",
  });

  const firewall = new civo.Firewall(name, {
    networkId: network.id,
  });

  args.rules.map(
    (rule) =>
      new civo.FirewallRule(`${name}-${rule.label}`, {
        action: "allow",
        label: rule.label,
        protocol: rule.protocol,
        cidrs: [rule.cidr],
        startPort: rule.port,
        direction: "ingress",
        firewallId: firewall.id,
      })
  );
};

createNetwork("one-functions", {
  rules: [
    {
      label: "https",
      protocol: "tcp",
      port: "443",
      cidr: "0.0.0.0/0",
    },
    {
      label: "http",
      protocol: "tcp",
      port: "80",
      cidr: "0.0.0.0/0",
    },
  ],
});

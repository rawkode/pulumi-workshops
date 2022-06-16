import * as pulumi from "@pulumi/pulumi";
import * as civo from "@pulumi/civo";
import * as kubernetes from "@pulumi/kubernetes";

interface ClusterArgs {
  pool: PoolArgs;
  applications: string;
}

interface PoolArgs {
  nodeCount: number;
  nodeSize: string;
}

interface WorkloadArgs {
  image: string;
  port: number;
  replicas?: number;
}

export class Cluster extends pulumi.ComponentResource {
  private provider: kubernetes.Provider;
  private cluster: civo.KubernetesCluster;
  private name: string;

  constructor(
    name: string,
    args: ClusterArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("workshop:cluster:Cluster", name, {}, opts);

    this.name = name;

    const network = new civo.Network(
      name,
      {
        label: name,
      },
      {
        parent: this,
      }
    );

    const firewall = new civo.Firewall(
      name,
      {
        networkId: network.id,
      },
      {
        parent: this,
      }
    );

    const cluster = new civo.KubernetesCluster(
      name,
      {
        name,
        networkId: network.id,
        firewallId: firewall.id,
        applications: args.applications,
        pools: {
          nodeCount: args.pool.nodeCount,
          size: args.pool.nodeSize,
        },
      },
      {
        parent: this,
      }
    );

    this.cluster = cluster;

    this.provider = new kubernetes.Provider(
      name,
      {
        kubeconfig: cluster.kubeconfig,
      },
      {
        parent: cluster,
      }
    );
  }

  public addWorkload(name: string, args: WorkloadArgs) {
    const workload = new kubernetes.apps.v1.Deployment(
      `${this.name}-${name}`,
      {
        spec: {
          replicas: args.replicas || 2,
          selector: {
            matchLabels: {
              app: name,
            },
          },
          template: {
            metadata: {
              labels: {
                app: name,
              },
            },
            spec: {
              containers: [
                {
                  name: name,
                  image: args.image,
                  ports: [{ containerPort: args.port }],
                },
              ],
            },
          },
        },
      },
      {
        parent: this.cluster,
        provider: this.provider,
      }
    );
  }
}

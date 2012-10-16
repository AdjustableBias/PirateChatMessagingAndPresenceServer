<?xml version="1.0" encoding="utf-8"?>
<serviceModel xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" name="piratechatws" generation="1" functional="0" release="0" Id="0e677cec-9913-46c1-bc28-b32eeea3541e" dslVersion="1.2.0.0" xmlns="http://schemas.microsoft.com/dsltools/RDSM">
  <groups>
    <group name="piratechatwsGroup" generation="1" functional="0" release="0">
      <componentports>
        <inPort name="WorkerRole1:HttpIn" protocol="tcp">
          <inToChannel>
            <lBChannelMoniker name="/piratechatws/piratechatwsGroup/LB:WorkerRole1:HttpIn" />
          </inToChannel>
        </inPort>
      </componentports>
      <settings>
        <aCS name="WorkerRole1Instances" defaultValue="[1,1,1]">
          <maps>
            <mapMoniker name="/piratechatws/piratechatwsGroup/MapWorkerRole1Instances" />
          </maps>
        </aCS>
      </settings>
      <channels>
        <lBChannel name="LB:WorkerRole1:HttpIn">
          <toPorts>
            <inPortMoniker name="/piratechatws/piratechatwsGroup/WorkerRole1/HttpIn" />
          </toPorts>
        </lBChannel>
      </channels>
      <maps>
        <map name="MapWorkerRole1Instances" kind="Identity">
          <setting>
            <sCSPolicyIDMoniker name="/piratechatws/piratechatwsGroup/WorkerRole1Instances" />
          </setting>
        </map>
      </maps>
      <components>
        <groupHascomponents>
          <role name="WorkerRole1" generation="1" functional="0" release="0" software="C:\node\piratechatws\local_package.csx\roles\WorkerRole1" entryPoint="base\x64\WaHostBootstrapper.exe" parameters="base\x64\WaWorkerHost.exe " memIndex="1792" hostingEnvironment="consoleroleadmin" hostingEnvironmentVersion="2">
            <componentports>
              <inPort name="HttpIn" protocol="tcp" portRanges="80" />
            </componentports>
            <settings>
              <aCS name="__ModelData" defaultValue="&lt;m role=&quot;WorkerRole1&quot; xmlns=&quot;urn:azure:m:v1&quot;&gt;&lt;r name=&quot;WorkerRole1&quot;&gt;&lt;e name=&quot;HttpIn&quot; /&gt;&lt;/r&gt;&lt;/m&gt;" />
            </settings>
            <resourcereferences>
              <resourceReference name="DiagnosticStore" defaultAmount="[4096,4096,4096]" defaultSticky="true" kind="Directory" />
              <resourceReference name="EventStore" defaultAmount="[1000,1000,1000]" defaultSticky="false" kind="LogStore" />
            </resourcereferences>
          </role>
          <sCSPolicy>
            <sCSPolicyIDMoniker name="/piratechatws/piratechatwsGroup/WorkerRole1Instances" />
            <sCSPolicyFaultDomainMoniker name="/piratechatws/piratechatwsGroup/WorkerRole1FaultDomains" />
          </sCSPolicy>
        </groupHascomponents>
      </components>
      <sCSPolicy>
        <sCSPolicyFaultDomain name="WorkerRole1FaultDomains" defaultPolicy="[2,2,2]" />
        <sCSPolicyID name="WorkerRole1Instances" defaultPolicy="[1,1,1]" />
      </sCSPolicy>
    </group>
  </groups>
  <implements>
    <implementation Id="9fcfcd9f-81ba-4701-9296-915161b26f69" ref="Microsoft.RedDog.Contract\ServiceContract\piratechatwsContract@ServiceDefinition">
      <interfacereferences>
        <interfaceReference Id="72451e5f-1429-49cd-99ab-712f3bcb1bd7" ref="Microsoft.RedDog.Contract\Interface\WorkerRole1:HttpIn@ServiceDefinition">
          <inPort>
            <inPortMoniker name="/piratechatws/piratechatwsGroup/WorkerRole1:HttpIn" />
          </inPort>
        </interfaceReference>
      </interfacereferences>
    </implementation>
  </implements>
</serviceModel>